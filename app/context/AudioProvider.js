import React, { useContext, Component, createContext, useEffect } from "react";
import { Text, StyleSheet, View, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import NetInfo from "@react-native-community/netinfo";

import { Audio } from "expo-av";
import {
  issetInArray,
  getCurrentDate,
  storeAudioForNextOpening,
  getDifferenceBetweenTwoHours,
} from "../misc/Helper";
import RNFetchBlob from "rn-fetch-blob";
import DownloadingGif from "../components/DownloadingGif";
import { play, playNext } from "../misc/AudioController";

//Şarkıları listelemek için kullanırlır
//ScrollView'den daha performanlısdır.
import { DataProvider } from "recyclerlistview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";
import config from "../misc/config";
import { newAuthContext } from "../context/newAuthContext";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";
import Realm, { BSON } from "realm";
import { AnonsShema, AppSettings } from "../database/DatabaseShemas";

//Test Anonslar
import TestAnons from "../TestAnons";
import color from "../misc/color";
export const AudioContext = createContext();

export class AudioProvider extends Component {
  static contextType = newAuthContext;

  constructor(props) {
    super(props);

    this.state = {
      //Mediadan alınan şarkılar
      audioFiles: [],

      //Permission hataları
      permissionError: false,

      //Şarkı listesi
      dataProvider: new DataProvider((r1, r2) => r1 !== r2),

      //Şarkı çalma conrtolleri.
      playbackObj: null,
      soundObj: null,
      currentAudio: {},
      isPlaying: false,
      currentAudioIndex: null,
      howManySongPlayed: 0,

      //Slider için
      playbackPosition: null,
      playbackDuration: null,

      userData: null,
      totalSongInTheServer: {},

      //Downloads
      isDownloading: false,
      currentDownloadedSong: "",
      currentSongNumber: null,
      waitLittleBitStillDownloading: false,

      //songs
      songs: [],

      //AllAnons
      anons: [],
      anonsIsPlaying: true,
      anonsSoundObj: null,
      currentAnons: null,
      currentPlayingAnons: null,

      //Song and Anons in the Storage
      downloadedSongs: [],
      downloadedAnons: [],

      //Playlist
      currentPlaylist: [],
      anonsPlaylist: [],

      //Anons Database bağlantısı
      DBConnection: null,
      AppSettingsConnection: null,

      //Güncel tarih
      whatIsTheDate: `${getCurrentDate(
        new Date()
      )}T${new Date().toLocaleTimeString({
        hour12: false,
        hour: "2-digit",
        timeZone: "Europe/Istanbul",
      })}`,

      //Playlist güncelleme tarih
      lastPlaylistUpdateTime: null,
    };

    this.totalAudioCount = 0;
  }

  /**
   * Application açıldığında en son şarkıyı
   * Alır ve çalar.
   */
  loadPreviousAudio = async () => {
    let previousAudio = await AsyncStorage.getItem("previousAudio");
    let currentAudio;
    let currentAudioIndex;

    //Kullanıcı henüz bir şarkı çaldırmadı
    if (previousAudio === null) {
      currentAudio = this.state.audioFiles[0];
      currentAudioIndex = 0;
    } else {
      (previousAudio = JSON.parse(previousAudio)),
        (currentAudio = previousAudio.audio);
      currentAudioIndex = previousAudio.index;
    }

    //Durumu güncelle
    this.setState({ ...this.state, currentAudio, currentAudioIndex });
  };

  //Hata mesajı göster.
  permissionAlert = () => {
    Alert.alert(
      "Şarkılara erişim izni verilmek zorunlu.",
      "Uygulama izne ihtiyaç duyar.",
      [
        { text: "Tamam, izin ver.", onPress: this.getPermission() },
        { text: "Hayır", onPress: this.permissionAlert() },
      ]
    );
  };

  /**
   * Kullanıcıdan şarkılarına erişim izni iste
   */
  getPermission = async () => {
    //Erişim al.
    // this.state.DBConnection.write(() => {
    //   let appSettings = this.state.DBConnection.objects("AppSettings");
    //   this.state.DBConnection.delete(appSettings);
    //   appSettings = null;
    // });

    //const permissionStored = this.state.DBConnection.objects("AppSettings")[0];

    const permission = await MediaLibrary.getPermissionsAsync();

    //İzin verildiy mi?
    if (permission.granted) {
      //izin verildi tüm şarkıları aall
      this.savePermission("granted");
    }
    if (!permission.granted && !permission.canAskAgain) {
      this.setState({ ...this.state, permissionError: true });
      return;
    }
    //İzin verilmedi ama yeniden sorulabilir.
    //O zaman soralım!
    if (!permission.granted && permission.canAskAgain) {
      const { status, canAskAgain } =
        await MediaLibrary.requestPermissionsAsync();

      //Bize izin vermedi!
      if (status === "denied" && canAskAgain) {
        //Bir hata göster
        this.permissionAlert();
      }

      //Izin verildi..
      if (status === "granted") {
        //Tüm şarkıları all..
        this.savePermission("granted");
      }

      if (!permission.canAskAgain && !permission.granted) {
        this.setState({ ...this.state, permissionError: true });
        this.savePermission("denied");
      }

      //izin verilmedi ve yeniden sormamızı mı engelledi!!
      if (status === "denied" && !canAskAgain) {
        //Ona bir şeyler söyle..
        this.setState({ ...this.state, permissionError: true });
        this.savePermission("denied");
      }
    }
  };

  /**
   * Şarkı dosyalarını al.
   */
  getAudioFiles = async () => {
    console.log("--------------TEST");
    const { dataProvider, audioFiles } = this.state;
    //const { audioFiles } = this.state;
    let media = await MediaLibrary.getAssetsAsync({ mediaType: "audio" });

    //Tüm şarkıları listele.
    media = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: media.totalCount,
    });

    this.totalAudioCount = media.totalCount;

    //Şarkıları state ata.

    this.setState({
      ...this.state,
      dataProvider: dataProvider.cloneWithRows([
        ...audioFiles,
        ...media.assets,
      ]),
      audioFiles: [...audioFiles, ...media.assets],
    });

    //Anonsları al
    //const anons = JSON.parse(await AsyncStorage.getItem("anons"));
    const anons = TestAnons;

    //Şarkıları da al.
    const songs = JSON.parse(await AsyncStorage.getItem("songs"));
    //const songs = this.state.songs;

    const filtered_song = [];
    let anons_must_be_shown = [];

    //Timeline

    //let timeline_seconds = timeline_minutes * 60;

    for (let i = 0; i < this.state.audioFiles.length; i++) {
      const file_name = this.state.audioFiles[i].filename;

      //Ses
      for (let d = 0; d < songs?.length; d++) {
        const dosya_name = `sound_${songs[d].DosyaIsmi}`;
        if (dosya_name == file_name) {
          //Daha önce filterlenmiş mi?
          let alreadyIsset = false;
          for (let f = 0; f < filtered_song.length; f++) {
            if (dosya_name == filtered_song[f].filename) {
              alreadyIsset = true;
            }
          }
          if (alreadyIsset) {
            continue;
          }
          filtered_song.push({
            albumId: this.state.audioFiles[i].albumId,
            creationTime: this.state.audioFiles[i].creationTime,
            duration: this.state.audioFiles[i].duration,
            filename: this.state.audioFiles[i].filename,
            height: this.state.audioFiles[i].height,
            id: this.state.audioFiles[i].id,
            mediaType: this.state.audioFiles[i].mediaType,
            modificationTime: this.state.audioFiles[i].modificationTime,
            uri: this.state.audioFiles[i].uri,
            width: this.state.audioFiles[i].width,
            Aktif: songs[d].Aktif,
            Album: songs[d].Album,
            DosyaIsmi: songs[d].DosyaIsmi,
            GrupTanimlamaKodu: songs[d].GrupTanimlamaKodu,
            Ismi: songs[d].Ismi,
            IsrcKodu: songs[d].IsrcKodu,
            PlaylistTanimlamaKodu: songs[d].PlaylistTanimlamaKodu,
            SarkiId: songs[d].SarkiId,
            Sarkici: songs[d].Sarkici,
            SarkiciId: songs[d].SarkiciId,
            SesLink: songs[d].SesLink,
            Silindi: songs[d].Silindi,
            Sure: songs[d].Sure,
            FileType: "audio",
            timeLineMinutes: 0,
            timeLineHours: 0,
          });
        }
      }

      //Anons
      for (let a = 0; a < anons?.length; a++) {
        const dosya_name = anons[a].anons.DosyaIsmi;
        if (`anons_${dosya_name}` == file_name) {
          const start = getCurrentDate(
            new Date(anons[a].task.Baslangic.split("T")[0])
          );
          const end = getCurrentDate(
            new Date(anons[a].task.Bitis.split("T")[0])
          );
          const today = getCurrentDate().split("T")[0];
          const repeatServer = anons[a].task.TekrarSayisi || 1;
          const option = anons[a].task.Secenek
            ? anons[a].task.Secenek.split(",")
            : [];
          const anonsHours =
            anons[a].task.Baslangic.split("T")[1].split(":")[0];
          const anonsMinutes =
            anons[a].task.Baslangic.split("T")[1].split(":")[1];
          const currentHours = new Date().getHours();
          const currentMinutes = new Date().getMinutes();
          const optionType = anons[a].task.SecenekTipi.split(",");
          const currentDay = new Date().getDay();

          let singItToday = issetInArray(option, currentDay);

          this.state.DBConnection.write(() => {
            let anons = this.state.DBConnection.objects("AnonsDocs");
            this.state.DBConnection.delete(anons);
            anons = null;
          });

          // Local databaseden tekrar sayısını al.
          const AnonsRepeats = this.getAnonRepeatsFromDatabase(
            anons[a].anons.Id
          );

          // Ikı zaman arasındaki farkı al.
          // const diffBetweenLastAnons = getDifferenceBetweenTwoHours(
          //   new Date(AnonsRepeats.repeatDate).getTime(),
          //   new Date(this.state.whatIsTheDate).getTime()
          // );

          let ListenedSongCount = JSON.parse(
            await AsyncStorage.getItem("ListenedSongCount")
          ).ListenedSongCount;

          console.log("ListentedCount----------------", ListenedSongCount);
          //Bu anons çalınması gerekiyor mu?
          //Şartları kontrol et.
          let isAnonsShowable = false;

          //Anons saati var m?
          //Haftalık mı çalınacak?
          //Sepesifik saatler için
          if (option.length != 0) {
            console.log("---------------EV DER");
            isAnonsShowable =
              today >= start &&
              today <= end &&
              singItToday == true &&
              currentHours == anonsHours &&
              currentMinutes == anonsMinutes &&
              AnonsRepeats.repeats <= repeatServer;
          }

          //Tekrarlı anons gün içinde ikince defa çalıyor
          //YOKSA anons saati
          //Ozaman REPEAT_PERIOT_TIME sayısı kadar şarkı çalındı ise anosu yap
          //Başlangıç saati belirle.
          if (
            anonsHours == "00" &&
            anonsMinutes == "00" &&
            option.length == 0
          ) {
            isAnonsShowable =
              today >= start &&
              today <= end &&
              AnonsRepeats.repeats <= repeatServer &&
              ListenedSongCount >= config.REPEAT_PERIOT_TIME; //Son çalınan anonsun üzerinden x kadar geçti ise.
          }

          //Tekrarlı anons gün için de ilk defa çalıyorsa.
          if (
            AnonsRepeats.repeats == 0 &&
            anonsHours == "00" &&
            anonsMinutes == "00" &&
            option.length == 0
          ) {
            //Ilk defa çalıyorsa saatin kaç olduğuna bak.
            isAnonsShowable =
              today >= start &&
              today <= end &&
              AnonsRepeats.repeats <= repeatServer &&
              ListenedSongCount >= config.REPEAT_PERIOT_TIME &&
              currentHours == config.FIRST_PERIOT_TIME.split(":")[0] &&
              currentMinutes == config.FIRST_PERIOT_TIME.split(":")[1]; //Son çalınan anonsun üzerinden x kadar geçti ise.
          }

          const showIt = {
            AnonsName: anons[a].anons.AnonsIsmi,
            Start: start,
            Today: today,
            End: end,
            optionType: optionType,
            AnonsDays: option,
            Show: isAnonsShowable,
            currentHour: currentHours,
            currentDay: currentDay,
            currentMunites: currentMinutes,
            anonsHours: anonsHours,
            anonsMinutes: anonsMinutes,
            singItToday: singItToday,
            repeat: repeatServer,
            anonsRepeated: AnonsRepeats.repeats,
            lastAnonsRepeatTime: AnonsRepeats.repeatDate,
            anonsPeriotTime: config.REPEAT_PERIOT_TIME,
          };

          //Bu gün yeterince çaldı mı?

          console.log(showIt);

          const anons_container = {
            albumId: this.state.audioFiles[i].albumId,
            creationTime: this.state.audioFiles[i].creationTime,
            duration: this.state.audioFiles[i].duration,
            filename: this.state.audioFiles[i].filename,
            height: this.state.audioFiles[i].height,
            id: this.state.audioFiles[i].id,
            mediaType: this.state.audioFiles[i].mediaType,
            modificationTime: this.state.audioFiles[i].modificationTime,
            uri: this.state.audioFiles[i].uri,
            width: this.state.audioFiles[i].width,
            Aciklama: anons[a].task.Aciklama,
            Aktif: anons[a].task.Aktif,
            Baslangic: anons[a].task.Baslangic,
            Bitis: anons[a].task.Bitis,
            Durumu: anons[a].task.Durumu,
            GT: anons[a].task.GT,
            GK: anons[a].task.GK,
            Ismi: anons[a].anons.AnonsIsmi,
            GorevTipAciklama: anons[a].task.GorevTipAciklama,
            GorevTipi: anons[a].task.GorevTipi,
            GrupTanimlamaKodu: anons[a].task.GrupTanimlamaKodu,
            Id: anons[a].anons.Id,
            KK: anons[a].task.KK,
            KT: anons[a].task.KT,
            KayitBilgisi: anons[a].task.KayitBilgisi,
            SecenekTipi: anons[a].task.SecenekTipi,
            Secenek: anons[a].task.Secenek,
            Secenek: anons[a].task.Secenek,
            SecenekAciklama: anons[a].task.SecenekAciklama,
            Silindi: anons[a].task.Silindi,
            TekrarSayisi: anons[a].task.TekrarSayisi,
            FileType: "anons",
            timeLineMinutes: 0,
            timeLineHours: 0,
            anonsRepeated: AnonsRepeats.repeats,

            //Anons Playlistte gösterilsin mi?
            Show: isAnonsShowable,
            showIt: showIt,
          };

          //Eğer çaldı ise ekle

          //Çalma sayısını ekle database e
          if (isAnonsShowable == true) {
            this.writeAnonsToDatabase(
              anons[a].anons.Id,
              AnonsRepeats.repeats,
              repeatServer,
              anons[a].anons.AnonsIsmi
            );
          }

          anons_must_be_shown.push(anons_container);
          //console.log(showIt);
        }
      }
    }

    //this.setState({ ...this.state, audioFiles: filtered_song });
    this.setState({
      ...this.state,
      dataProvider: dataProvider.cloneWithRows([
        ...audioFiles,
        ...filtered_song,
      ]),
      audioFiles: filtered_song,
    });

    this.setState({ ...this.state, anonsPlaylist: anons_must_be_shown });
  };

  /**
   * Internet yoksa, şarkı listesini Storage'tan al.
   * //Ve çalll
   */
  ifThereIsNOOInternet = async () => {
    NetInfo.fetch().then(async (connection) => {
      try {
        //Heger ki internet yoksammm
        if (!connection.isConnected) {
          this.state.songs = JSON.parse(await AsyncStorage.getItem("songs"));
          //TODO:START
          //Listeyi güncelle
          await this.getAudioFiles();
          this.startToPlay();
        }
      } catch (e) {
        throw "Hata! ";
      }
    });
  };

  /**
   * Serverda kaç tane şarkı var, sayısını verrir
   * @param {string} groupCode Group kkod
   * @param {string} username Kullanıcı e-postassı
   * @param {string} password kullanıcı şifresi
   */
  checkHowManySongsInTheServer = async (groupCode, username, password) => {
    try {
      const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <KullnaiciSarkiGuncellemeBilgisi xmlns="http://tempuri.org/">
             <SertifikaBilgileri>
                <KullaniciAdi>${config.SER_USERNAME}</KullaniciAdi>
                <Sifre>${config.SER_PASSWORD}</Sifre>
            </SertifikaBilgileri>
            <Eposta>${username}</Eposta>
            <Sifre>${password}</Sifre>

            <!-- Kullanici Grup Listesinden Geliyor -->
            <GrupTanimlamaKodu>
                <string>${groupCode}</string>
            </GrupTanimlamaKodu>         
                  
        </KullnaiciSarkiGuncellemeBilgisi>
      </soap:Body>
      </soap:Envelope>`;

      await axios
        .post(config.SOAP_URL, xml, {
          headers: { "Content-Type": "text/xml" },
        })
        .then((resData) => {
          const options = {
            ignoreNameSpace: false,
            ignoreAttributes: false,
          };

          const parser = new XMLParser(options);
          const parsedData = parser.parse(
            resData.data.match(
              /<KullnaiciSarkiGuncellemeBilgisiResult>([\s\S]*)<\/KullnaiciSarkiGuncellemeBilgisiResult>/im
            )[1]
          );

          this.setState({ ...this, totalSongInTheServer: parsedData });
          return parsedData;
        })
        .catch((res) => {
          console.log("--******---");
          //Internet yoksa
          this.ifThereIsNOOInternet();
        });
    } catch (error) {
      console.log("Heee");
      console.error(`SOAP FAIL: ${error}`);
    }
  };

  /**
   * Serrverdan kullanıcıya ait playlisti alır ve download eder.
   * //Storage kayıt eder.
   */
  getUserGroupListFromServer = async () => {
    //Kullanıcı bilgilerini al
    const username = await AsyncStorage.getItem("username");
    const password = await AsyncStorage.getItem("password");
    //const totalUserSong = JSON.parse(await AsyncStorage.getItem("userSongs"));

    try {
      const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <KullaniciGrupListesi xmlns="http://tempuri.org/">
            <SertifikaBilgileri>
            <KullaniciAdi>${config.SER_USERNAME}</KullaniciAdi>
            <Sifre>${config.SER_PASSWORD}</Sifre>
            </SertifikaBilgileri>
            <Eposta>${username}</Eposta>
        <Sifre>${password}</Sifre>
        </KullaniciGrupListesi>
    </soap:Body>
</soap:Envelope>`;

      axios
        .post(config.SOAP_URL, xml, {
          headers: { "Content-Type": "text/xml" },
        })

        .then((resData) => {
          const options = {
            ignoreNameSpace: false,
            ignoreAttributes: false,
          };

          const parser = new XMLParser(options);

          const parsedData = parser.parse(
            resData.data.match(/<GrupPlasylist>([\s\S]*)<\/GrupPlasylist>/im)[1]
          );

          return parsedData;
        })
        .then(async (userGroupInfoFromServer) => {
          const totalSongFromServer = await this.checkHowManySongsInTheServer(
            userGroupInfoFromServer.WsGrupPlaylistDto.GrupTanimlamaKodu,
            username,
            password
          );

          //console.log(this.state.totalSongInTheServer.ToplamSayfa);
          // for (
          //   let i = 1;
          //   i <= this.state.totalSongInTheServer.ToplamSayfa;
          //   i++
          // ) {
          for (let i = 1; i <= 3; i++) {
            this.getAllSongs(
              userGroupInfoFromServer.WsGrupPlaylistDto.GrupTanimlamaKodu,
              username,
              password,
              i
            );
          }
          //Son güncelleme tarihini sakla
          await AsyncStorage.setItem(
            "Last_Playlist_Update_Time",
            this.state.whatIsTheDate
          );
        })
        .catch(async (res) => {
          //heger kiii internet yokksaam :)
          this.ifThereIsNOOInternet();
        });
    } catch (error) {
      console.log("Heee");
      console.error(`SOAP FAIL: ${error}`);
    }
  };

  /**
   * Serverdan playlisti alır ve download eder.
   */
  getAllSongs = async (groupCode, username, password, pageNo) => {
    try {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <soap:Body>
            <KullnaiciFSLSarkiListesiGuncelleme xmlns="http://tempuri.org/"> 
            <SertifikaBilgileri>
                    <KullaniciAdi>${config.SER_USERNAME}</KullaniciAdi>
                    <Sifre>${config.SER_PASSWORD}</Sifre>
                </SertifikaBilgileri>
                <Eposta>${username}</Eposta>
                <Sifre>${password}</Sifre>
                <!-- Kullaniczi Grup Listesinden Geliyor -->
                <GrupTanimlamaKodu>${groupCode}</GrupTanimlamaKodu>
                <SarkiIdListesi />   
                <SayfaNo>${pageNo}</SayfaNo>
            </KullnaiciFSLSarkiListesiGuncelleme>
        </soap:Body>
    </soap:Envelope>`;

      axios
        .post(config.SOAP_URL, xml, {
          headers: { "Content-Type": "text/xml" },
        })
        .then(async (resData) => {
          const options = {
            ignoreNameSpace: false,
            ignoreAttributes: false,
          };

          //Seç
          const parser = new XMLParser(options);
          const parsedData = parser.parse(
            resData.data.match(
              /<KullnaiciFSLSarkiListesiGuncellemeResult>([\s\S]*)<\/KullnaiciFSLSarkiListesiGuncellemeResult>/im
            )[1]
          );

          //Şarkıları Playliste ekle

          //Hepsini indir.
          for (let i = 0; i <= parsedData.Liste.WsSarkiDto.length; i++) {
            this.setState({ ...this, currentSongNumber: i });

            //Push it into the array
            this.state.downloadedSongs.push(parsedData.Liste.WsSarkiDto[i]);

            //Serverdan cihaza indir.
            if (parsedData.Liste.WsSarkiDto[i]) {
              //Download işlemini başlat
              await this.DownloadSoundFromServer(
                parsedData.Liste.WsSarkiDto[i],
                "sound",
                i
              );
              this.setState({
                ...this,
                songs: [...this.state.songs, parsedData.Liste.WsSarkiDto[i]],
              });

              //Download işlemi bittikten sonra Çalma Listesini güncelle
              if (i == parsedData.Liste.WsSarkiDto.length - 1) {
                //Download işlemi bitti
                this.setState({ ...this, isDownloading: false });
                this.setState({ ...this, currentDownloadedSong: "" });
                this.setState({ ...this, currentSongNumber: null });

                //Save it to storage
                await AsyncStorage.setItem(
                  "songs",
                  //JSON.stringify(parsedData.Liste.WsSarkiDto)
                  JSON.stringify(this.state.songs)
                );

                //TODO:START
                //Listeyi güncelle
                console.log("---HII--");
                await this.getAudioFiles();

                //ilk part ((10 adet)) indirildikten sonra çal
                if (pageNo == 1) {
                  this.startToPlay();
                  this.state.waitLittleBitStillDownloading = true;
                }

                //Tüm şarkılar indiyse
                if (pageNo == parsedData.ToplamSayfa) {
                  this.state.waitLittleBitStillDownloading = false;
                }
              }
            }
          }

          return parsedData;
        });
    } catch (error) {
      //Save it to storage
      console.error(`SOAP FAIL: ${error}`);
    }
  };

  /**
   * Server'dan şarkıları çeker
   * @param {object} sounds indirilicek şarkı
   */
  DownloadSoundFromServer = async (sounds, downloadType = "sound", i) => {
    try {
      const { DownloadDir } = RNFetchBlob.fs.dirs;

      let soundName = `${DownloadDir}/${downloadType}_${sounds?.DosyaIsmi}`;

      const options = {
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: false,
          path: soundName,
          description: "Downloading.",
        },
      };

      //Dosya yok is indir.
      //Dosyayı daha önce indirmişsek, bir şey yapma..
      if (!(await RNFetchBlob.fs.exists(soundName))) {
        //Şarkıyı indir..
        if (sounds.SesLink) {
          await RNFetchBlob.config(options).fetch("GET", sounds.SesLink);

          this.setState({ ...this, isDownloading: true });
          this.setState({
            ...this,
            currentDownloadedSong:
              downloadType == "anons"
                ? sounds?.AnonsIsmi
                : sounds?.Ismi.split("_")[1],
          });
          console.log("iiiiiiiii", i);
          //İlk şarkıdan sonra çalmaya başla
          if (i == 1 && downloadType == "sound") {
            console.log("---TEST:HII--");
            await this.getAudioFiles();
            this.startToPlay();
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*********************** ANONS *********************** */

  /**
   * Kullanıcıya ait tüm anonsları çeker
   */
  getAllAnonsFromServer = async () => {
    //Kullanıcı bilgilerini al
    const username = await AsyncStorage.getItem("username");
    const password = await AsyncStorage.getItem("password");
    //const totalUserSong = JSON.parse(await AsyncStorage.getItem("userSongs"));

    const xml = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <KullaniciAnonsListesi xmlns="http://tempuri.org/">
            <SertifikaBilgileri>
                <KullaniciAdi>${config.SER_USERNAME}</KullaniciAdi>
                <Sifre>${config.SER_PASSWORD}</Sifre>
            </SertifikaBilgileri>
            <Eposta>${username}</Eposta>
            <Sifre>${password}</Sifre>
        </KullaniciAnonsListesi>
    </soap:Body>
</soap:Envelope>`;
    try {
      axios
        .post(config.SOAP_URL, xml, {
          headers: { "Content-Type": "text/xml" },
        })
        .then(async (resData) => {
          const options = {
            ignoreNameSpace: false,
            ignoreAttributes: false,
          };

          const parser = new XMLParser(options);

          //Anonslar
          const anons = parser.parse(
            resData.data.match(
              /<KullaniciAnonsListesiResult>([\s\S]*)<\/KullaniciAnonsListesiResult>/im
            )[1]
          );

          return anons;
        })
        .then(async (allAnons) => {
          const anonsResult = [];

          anonsResult[0] = allAnons.AnonsListesi.wsAnonsDto;
          anonsResult[1] = allAnons.GorevListesi.AnonsGorevTanimDto;

          const pretty_anons = [];
          for (let i = 0; i < anonsResult[0].length; i++) {
            //LoperGorevler
            for (let a = 0; a <= anonsResult[1].length; a++) {
              if (
                anonsResult[0][i]?.GrupTanimlamaKodu ==
                anonsResult[1][a]?.GrupTanimlamaKodu
              ) {
                pretty_anons.push({
                  anons: anonsResult[0][i],
                  task: anonsResult[1][a],
                });
              }
            }
          }
          // console.log("--------------PRETYYY----------------------");
          // console.log(pretty_anons);

          for (let p = 0; p < pretty_anons?.length; p++) {
            if (pretty_anons[p].anons != "undefined") {
              await this.DownloadSoundFromServer(
                pretty_anons[p].anons,
                "anons"
              ).then(async () => {
                //Anons Download işlemi bittiyse
                if (p == pretty_anons?.length - 1) {
                  //Download işlemi bitti
                  this.setState({ ...this, isDownloading: false });
                  this.setState({ ...this, currentDownloadedSong: "" });
                  this.setState({ ...this, currentSongNumber: null });

                  //TODO:START
                  //this.getAudioFiles();
                  //this.startToPlay();

                  //Save it to storage
                  await AsyncStorage.setItem(
                    "anons",
                    JSON.stringify(pretty_anons)
                  );
                }
              });
            }
          }

          //Anons array'ini oluştur.
          //console.log(pretty_anons);
          //AsyncStorage.setItem("anons", JSON.stringify(pretty_anons));
          //console.log(this.state.playlist);
        });
    } catch (e) {}
  };

  getSoundsAndAnonsFromServer = async () => {
    //Ses dosyalarını serverdan indir.
    await this.setLastPlaylistUpdateTime();
    const lastPlaylistUpdateTime = await AsyncStorage.getItem(
      "Last_Playlist_Update_Time"
    );
    const diffTime = getDifferenceBetweenTwoHours(
      new Date(this.state.lastPlaylistUpdateTime).getTime(),
      new Date(this.state.whatIsTheDate).getTime()
    );

    //Şarkıları al
    //Eğer son güncelleme 1 dk yı gectiyse
    if (diffTime > 60000) {
      await this.getUserGroupListFromServer();
    } else {
      this.state.songs = JSON.parse(await AsyncStorage.getItem("songs"));
      //TODO:START
      //Listeyi güncelle
      console.log("---TEST:2--");
      await this.getAudioFiles();
      this.startToPlay();
    }

    //Anonsları her zaman all..
    await this.getAllAnonsFromServer();

    //console.log(this.state.playlist);
  };

  //Aanons Realm'e bağlan
  connectToAnonsDatabaseDoc = async () => {
    //Anonslar için bir bağlantı aç
    this.state.DBConnection = await Realm.open({
      schema: [AnonsShema, AppSettings],
      deleteRealmIfMigrationNeeded: true,
    });
  };

  connectToAppSettingsDB = async () => {
    this.state.AppSettingsConnection = await Realm.open({
      schema: [AppSettings],
      deleteRealmIfMigrationNeeded: true,
    });
  };

  //Anons Tekrarlarını veri sakla.
  writeAnonsToDatabase = (anonsId, repeats = 0, localRepeat, name) => {
    const date = getCurrentDate(new Date());
    //Check is there is any anons equal to anonsId
    try {
      let checkAnons = this.state.DBConnection.objects("AnonsDocs").filtered(
        `anonsId=${anonsId} && date='${date}'`
      );

      //Anons daha önce varsa
      if (
        typeof checkAnons == undefined ||
        checkAnons == NaN ||
        checkAnons.length == 0
      ) {
        //Yeni veriyi ekkle
        let insert;
        this.state.DBConnection.write(() => {
          //YOKSA EKLE
          insert = this.state.DBConnection.create("AnonsDocs", {
            _id: new BSON.ObjectID(),
            repeats: 1,
            anonsId: anonsId,
            repeatDate: this.state.whatIsTheDate,
            date: date,
            anonsName: name,
          });
        });
      } else {
        //Güncelleme yap
        this.state.DBConnection.write(() => {
          const anons = this.state.DBConnection.objects("AnonsDocs").filtered(
            `anonsId=${anonsId} && date='${date}'`
          )[0];
          //VAR GUNCELLE
          //Güncellemeyi en fazla serverdaki kadar yap.
          if (anons.repeats < localRepeat + 1) {
            anons.repeats += 1;
            anons.date = date;

            //Enson tekrar ettiği tarih
            anons.repeatDate = this.state.whatIsTheDate;
          }
        });
      }
    } catch (error) {}
  };

  //Anons Tekrarını al
  //Anons Kaç defa tekrar ettti
  //Database'den al
  //@anonsId
  getAnonRepeatsFromDatabase = (anonsId) => {
    try {
      const date = getCurrentDate(new Date());

      return this.state.DBConnection.write(() => {
        const repeats = this.state.DBConnection.objects("AnonsDocs").filtered(
          `anonsId=${anonsId} && date='${date}'`
        );
        if (repeats.length !== 0) {
          return repeats[0];
        }

        //Boş iswe
        if (repeats.length === 0) {
          return {
            repeats: 0,
            repeatDate: null,
          };
        }
      });
    } catch (er) {}
  };

  /**
   * Database bağlantısını yap
   */
  dbConnection = async () => {
    //DATAbase table bağlantıları
    try {
      await this.connectToAnonsDatabaseDoc().then(async () => {
        //this.requestToPermissions();
        //Musiclere erişim izni all
        await this.getPermission().then(async () => {
          await this.getSoundsAndAnonsFromServer();
        });

        //Serverdan şarkı ve anonsları al
      });
    } catch (error) {
      console.log(error);
      console.log("---------------SILAV");
    }
  };

  /**
   * Son güncelleme tarhini state ata.
   */
  setLastPlaylistUpdateTime = async () => {
    const lastPlaylistUpdateTime = await AsyncStorage.getItem(
      "Last_Playlist_Update_Time"
    );

    this.state.lastPlaylistUpdateTime = lastPlaylistUpdateTime;
  };
  /**
   * Componenet bağlandığında
   */
  componentDidMount = () => {
    //DB Bağlantı, dosya izni ve verileri databaseden all.
    this.dbConnection();
  };

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return;
    };
  }

  //Slider için positionı update et
  onPlaybackStatusUpdate = async (playbackStatus) => {
    if (playbackStatus.isLoaded && playbackStatus.isPlaying) {
      this.updateState(this, {
        playbackPosition: playbackStatus.positionMillis,
        playbackDuration: playbackStatus.durationMillis,
      });
    }

    //Şarkı bitti ise diğerine geç
    if (playbackStatus.didJustFinish) {
      //Şarkı bittiğinde yeni bir günceleme var mı yok mu diye kontrol et.
      //Anonsları çek.
      await this.getSoundsAndAnonsFromServer();

      //Çalının şarkı sayını bir artttır.
      this.saveListenedSongCount();

      console.log("------------NEXT: HIIIII----------");

      //Sonraki şarkının id'sini belirle
      const nextAudioIndex = this.state.currentAudioIndex + 1;

      //Son şarkıyı bul
      //Son şarkı ise, çalmayı durdur
      if (nextAudioIndex >= this.totalAudioCount) {
        this.state.playbackObj.unloadAsync();
        this.updateState(this, {
          soundObj: null,
          currentAudio: this.state.audioFiles[0],
          isPlaying: false,
          currentAudioIndex: 0,
          playbackPosition: null,
          playbackDuration: null,
        });
        return await storeAudioForNextOpening(this.state.audioFiles[0], 0);
      }

      //Eğer yukarıdaki şart geçerli değil ise sonraki şarkıya geç...
      //Ve Şarkıya geç ve çal, durumu güncelle
      const audio = this.state.audioFiles[nextAudioIndex];
      const status = await playNext(this.state.playbackObj, audio?.uri);
      this.updateState(this, {
        soundObj: status,
        currentAudio: audio,
        isPlaying: true,
        currentAudioIndex: nextAudioIndex,
      });
      await storeAudioForNextOpening(audio, nextAudioIndex);
    }
  };

  /**
   * Ses dosyalarını okumak için kullanılır
   * @param {string} permission granted | denied
   */
  savePermission = (permission) => {
    let AppSettings = this.state.DBConnection.objects("AppSettings")[0];

    if (
      !AppSettings ||
      typeof AppSettings.AudioFilePermission == undefined ||
      AppSettings.AudioFilePermission == ""
    ) {
      //Ekle
      this.state.DBConnection.write(() => {
        this.state.DBConnection.create("AppSettings", {
          _id: new BSON.ObjectID(),
          AudioFilePermission: permission,
        });
      });
    } else {
      //Güncelle

      this.state.DBConnection.write(() => {
        const app = this.state.DBConnection.objects("AppSettings")[0];
        app.AudioFilePermission = permission;
      });
    }
  };

  /**
   * ÇAlma sayısını
   */
  saveListenedSongCount = async () => {
    try {
      let count = await AsyncStorage.getItem("ListenedSongCount");
      console.log("COUNT", count);
      //Eğer boş ise?
      //İlk defa count edilecekse
      if (count != null) {
        count = JSON.parse(count);
      }

      if (count == null) {
        count = {
          ListenedSongCount: 0,
        };
      }

      //Var olanı bir arttır.
      count.ListenedSongCount = count.ListenedSongCount + 1;

      //Yeniden kayıt et.
      await AsyncStorage.setItem(
        "ListenedSongCount",
        JSON.stringify({ ListenedSongCount: count.ListenedSongCount })
      );
    } catch (error) {
      console.log("----------------dsfsdfds--");
      console.log(error);
    }
  };

  /**
   * Çalma sayısnı kaldırı
   */
  removeListenedSongCount = async () => {
    await AsyncStorage.setItem("ListenedSongCount", 1);
  };

  /**
   * Çal
   */
  startToPlay = async () => {
    this.saveListenedSongCount();
    setTimeout(async () => {
      if (this.state.soundObj == null) {
        const audio = this.state.audioFiles[0];

        //Playlisti oynatmaya başla
        //Play#1: Şarkıyı çal. Daha önce hiç çalınmamış ise
        const playbackObj = new Audio.Sound();

        //Controllerdan çağır.
        const status = await play(playbackObj, audio?.uri);
        const index = 0;

        //Yeni durumu state ata ve ilerlememesi için return'le
        this.updateState(this, {
          currentAudio: audio,
          playbackObj: playbackObj,
          soundObj: status,
          currentAudioIndex: index,

          // //Çalma-Durdurma iconları için
          isPlaying: true,
        });

        //Slider bar için statuyü güncelle
        playbackObj.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);
        this.state.isPlaying = true;
        //Application açıldığında
        //son çalınna şarkıyı bulmak için kullanırı
        storeAudioForNextOpening(audio, index);
      }
    }, 2000);
  };

  /**Kontrollerdan */
  updateState = (prevState, newState = {}) => {
    this.setState({ ...prevState, ...newState });
  };

  render() {
    const {
      audioFiles,
      permissionError,
      dataProvider,
      playbackObj,
      soundObj,
      currentAudio,
      isPlaying,
      userData,
      currentAudioIndex,
      playbackPosition,
      playbackDuration,
    } = this.state;

    if (permissionError)
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            fontSize: 30,
            color: "red",
          }}
        >
          <Text style={styles.permissionError}>
            Ses dosyalarına erişim izni vermediniz. Ayarları gidip erişim izni
            verin.
          </Text>
        </View>
      );

    return (
      <AudioContext.Provider
        value={{
          audioFiles,
          playbackObj,
          soundObj,
          currentAudio,
          isPlaying,
          currentAudioIndex,
          playbackPosition,
          playbackDuration,
          dataProvider: dataProvider,
          userData,
          getAudioFiles: this.getAudioFiles,
          newAuthContext: this.context.loadingState.userData,
          loadPreviousAudio: this.loadPreviousAudio,
          totalAudioCount: this.totalAudioCount,
          updateState: this.updateState,
          isDownloading: this.state.isDownloading,
          onPlaybackStatusUpdate: this.onPlaybackStatusUpdate,
          startToPlay: this.startToPlay,
          //ANONS
          anonsSoundObj: this.state.anonsSoundObj,
          currentPlayingAnons: this.state.currentPlayingAnons,
          anonsPlaylist: this.state.anonsPlaylist,
          getSoundsAndAnonsFromServer: this.getSoundsAndAnonsFromServer,
          waitLittleBitStillDownloading:
            this.state.waitLittleBitStillDownloading,
          removeListenedSongCount: this.removeListenedSongCount,
        }}
      >
        {this.state.isDownloading ? (
          <DownloadingGif songName={this.state.currentDownloadedSong} />
        ) : null}

        {this.props.children}
      </AudioContext.Provider>
    );
  }
}

const SetInternetInfo = ({ setNetInfo }) => {
  const netInfo = useNetInfo();

  useEffect(() => {
    setNetInfo(netInfo);
  }, [netInfo]);

  return null;
};

const styles = StyleSheet.create({
  permissionError: {
    fontSize: 30,
    color: color.WHITE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    textAlign: "center",
    backgroundColor: color.RED,
    padding: 15,
    borderRadius: 10,
  },
});
export default AudioProvider;
