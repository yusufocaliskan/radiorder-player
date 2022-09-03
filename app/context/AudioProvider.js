import React, { useContext, Component, createContext } from "react";
import { Text, View, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import {
  issetInArray,
  howManyTimeSingToday,
  getCurrentDate,
  storeAudioForNextOpening,
  getDifferenceBetweenTwoHours,
  setAnonsRepeatTimes,
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
//import { DBContext } from "./Database";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";
import Realm, { BSON } from "realm";

//Time
//import moment from "moment";
import moment from "moment-timezone";
require("moment/locale/tr.js");
require("moment/locale/en-gb.js");

//Test Anonslar
import TestAnons from "../TestAnons";
import { readFileRes } from "react-native-fs";

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

      //Slider için
      playbackPosition: null,
      playbackDuration: null,

      userData: null,
      totalSongInTheServer: {},

      //Downloads
      isDownloading: false,
      currentDownloadedSong: "",
      currentSongNumber: null,

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

      //time
      // whatTimeIsIt: moment().locale("tr").utcOffset("+03:00").format("h:m:s"),
      // whatTheDateIs: moment().utcOffset("+03:00").format("YYYY-MM-DD"),
      // whatTimeWithHours: moment().utcOffset("+03:00").format("YYYY-MM-DD h:m"),

      AnonsDBConnection: null,

      //Güncel tarih
      whatIsTheDate: `${getCurrentDate(
        new Date()
      )}T${new Date().toLocaleTimeString({
        hour12: false,
        hour: "2-digit",
        timeZone: "Europe/Istanbul",
      })}`,
    };

    this.totalAudioCount = 0;

    this.AnonsShema = {
      name: "AnonsDocs",
      properties: {
        _id: "objectId",
        repeats: "int",
        anonsId: "int",
        repeatDate: "mixed",
      },
    };
  }

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

  /**
   * Kullanıcıdan şarkılarına erişim izni iste
   */
  getPermission = async () => {
    //Erişim al.
    const permission = await MediaLibrary.getPermissionsAsync();

    //İzin verildiy mi?
    if (permission.granted) {
      //izin verildi tüm şarkıları aall
      this.getAudioFiles();
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
        this.getAudioFiles();
      }

      if (!permission.canAskAgain && !permission.granted) {
        this.setState({ ...this.state, permissionError: true });
      }

      //izin verilmedi ve yeniden sormamızı mı engelledi!!
      if (status === "denied" && !canAskAgain) {
        //Ona bir şeyler söyle..
        this.setState({ ...this.state, permissionError: true });
      }
    }
  };

  /**
   * Şarkı dosyalarını al.
   */
  getAudioFiles = async () => {
    const { dataProvider, audioFiles } = this.state;

    let media = await MediaLibrary.getAssetsAsync({ mediaType: "audio" });

    //Tüm şarkıları listele.
    media = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: media.totalCount,
    });

    this.totalAudioCount = media.totalCount;
    //console.log(fileDetailed);
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

    const filtered_song = [];
    let anons_must_be_shown = [];

    //Timeline

    //let timeline_seconds = timeline_minutes * 60;

    for (let i = 0; i < this.state.audioFiles.length; i++) {
      const file_name = this.state.audioFiles[i].filename;

      //Ses
      for (let d = 0; d < songs.length; d++) {
        const dosya_name = songs[d].DosyaIsmi;
        if (`sound_${dosya_name}` == file_name) {
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
      for (let a = 0; a < anons.length; a++) {
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

          // this.state.AnonsDBConnection.write(() => {
          //   let anons = this.state.AnonsDBConnection.objects("AnonsDocs");
          //   this.state.AnonsDBConnection.delete(anons);
          //   anons = null;
          // });

          // Local databaseden tekrar sayısını al.
          const AnonsRepeats = this.getAnonRepeatsFromDatabase(
            anons[a].anons.Id
          );

          console.log(AnonsRepeats);

          // const start = getCurrentDate(new Date(2022, 8, 1));
          // const end = getCurrentDate(new Date(2022, 9, 21));
          // const today = getCurrentDate(new Date(2022, 9, 2));
          // const repeatServer = anons[a].task.TekrarSayisi || 1;
          // const option = anons[a].task.Secenek
          //   ? anons[a].task.Secenek.split(",")
          //   : [];
          // const anonsHours = 21;
          // const anonsMinutes = 16;
          // const currentHours = 21;
          // const currentMinutes = 16;
          // const optionType = anons[a].task.SecenekTipi.split(",");
          // const currentDay = new Date().getDay();
          // let singItToday = issetInArray(option, currentDay);

          // //Local databaseden tekrar sayısını al.
          // const AnonsRepeats = this.getAnonRepeatsFromDatabase(
          //   anons[a].anons.Id
          // );

          console.log(new Date(AnonsRepeats.repeatDate));
          console.log(new Date(this.state.whatIsTheDate));
          // console.log(
          //   getDifferenceBetweenTwoHours(
          //     new Date(AnonsRepeats.repeatDate).getTime(),
          //     new Date(this.state.whatIsTheDate).getTime()
          //   )
          // );
          const diffBetweenLastAnons = getDifferenceBetweenTwoHours(
            new Date("2022-09-03T15:04:29.000Z").getTime(),
            new Date("2022-09-03T17:03:29.000Z").getTime()
          );

          //Bu anons çalınması gerekiyor mu?
          //Şartları kontrol et.
          let isAnonsShowable =
            today >= start && //Başlangıç tarihi geldi mi?
            today <= end && //Bittiiş tarihi geldi mi?
            currentHours == anonsHours && //Saatleri uyuşuyor mu?
            currentMinutes == anonsMinutes && //Anons dakikları uyuşuyor mu?
            singItToday == true && //Bu gün çalınması gerekiyor mu?
            repeatServer <= AnonsRepeats.repeats; //Çalma sayısı doldu mu?

          //Anons saati var m?
          //Haftalık mı çalınacak?
          if (option.length == 0) {
            singItToday = true;
            isAnonsShowable =
              today >= start && today <= end && singItToday == true;
          }

          //YOKSA anons saati
          //O zaman son çaldığı zamandan bu yana REPEAT_PERIOT_TIME saat geçmiş ise yeniden çal
          if (anonsHours == "00" && anonsMinutes == "00") {
            isAnonsShowable =
              today >= start &&
              today <= end &&
              singItToday == true &&
              AnonsRepeats.repeats <= repeatServer &&
              diffBetweenLastAnons >= REPEAT_PERIOT_TIME; //Son çalınan anonsun üzerinden x kadar geçti ise.
          }

          //console.log(this.state.whatTimeIsIt);

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
          };

          //Bu gün yeterince çaldı mı?

          // console.log(isAnonsShowable);
          // console.log(showIt);

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
            SecenekAciklama: anons[a].task.SecenekAciklama,
            Silindi: anons[a].task.Silindi,
            TekrarSayisi: anons[a].task.TekrarSayisi,
            FileType: "anons",
            timeLineMinutes: 0,
            timeLineHours: 0,
            anonsRepeated: AnonsRepeats.repeats,

            //Anons Playlistte gösterilsin mi?
            Show: isAnonsShowable,
          };

          //Çalma sayısını ekle database e
          this.writeAnonsToDatabase(
            anons[a].anons.Id,
            AnonsRepeats.repeats,
            repeatServer
          );

          // this.state.AnonsDBConnection.write(() => {
          //   let anons = this.state.AnonsDBConnection.objects("AnonsDocs");
          //   this.state.AnonsDBConnection.delete(anons);
          //   anons = null;
          // });
          //this.saveAnonsRepeatsToDatabase();

          anons_must_be_shown.push(anons_container);
          console.log(showIt);
        }
      }
    }
    //Toplam şarkı sayısını anons kadar eşit parçallara böl
    //console.log(JSON.stringify(devideEqualParts(500, 2)));
    //Anonsları karıştır

    //this.setState({ ...this.state, audioFiles: filtered_song });
    this.setState({
      ...this.state,
      dataProvider: dataProvider.cloneWithRows([
        ...audioFiles,
        ...filtered_song,
      ]),
      audioFiles: [...audioFiles, ...filtered_song],
    });

    this.setState({ ...this.state, anonsPlaylist: anons_must_be_shown });

    //console.log(this.state.audioFiles);
    //console.log(this.state.audioFiles);
    //console.log("------------------- PLAYLIST-------------------");
    //console.log(this.state.playlist);
    //console.log(media.assets.length);
  };

  /**
   * Serverda kaç tane şarkı var, sayısını verrir
   * @param {string} groupCode Group kkod
   * @param {string} username Kullanıcı e-postassı
   * @param {string} password kullanıcı şifresi
   */
  checkHowManySongsInTheServer = async (groupCode, username, password) => {
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

      .catch((error) => {
        console.error(`SOAP FAIL: ${error}`);
      });
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

        this.state.totalSongInTheServer.ToplamSayfa;
        //console.log(this.state.totalSongInTheServer.ToplamSayfa);
        //for (let i = 1; i <= this.state.totalSongInTheServer.ToplamSayfa; i++) {
        for (let i = 1; i < 2; i++) {
          //Tüm şarkıları indir..
          this.getAllSongs(
            userGroupInfoFromServer.WsGrupPlaylistDto.GrupTanimlamaKodu,
            username,
            password,
            i
          );
        }
      })

      .catch((error) => {
        console.error(`SOAP FAIL: ${error}`);
      });
  };

  /**
   * Serverdan playlisti alır ve download eder.
   */
  getAllSongs = async (groupCode, username, password, pageNo = 1) => {
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

          if (parsedData.Liste.WsSarkiDto[i]) {
            //Serverdan cihaza indir.
            await this.DownloadSoundFromServer(
              parsedData.Liste.WsSarkiDto[i],
              "sound"
            );

            //Download işlemi bittikten sonra Çalma Listesini güncelle
            if (i == parsedData.Liste.WsSarkiDto.length - 1) {
              //Download işlemi bitti
              this.setState({ ...this, isDownloading: false });
              this.setState({ ...this, currentDownloadedSong: "" });
              this.setState({ ...this, currentSongNumber: null });

              //TODO:START
              //this.startToPlay();

              //Save it to storage
              await AsyncStorage.setItem(
                "songs",
                JSON.stringify(parsedData.Liste.WsSarkiDto)
              );
            }
          }
        }

        return parsedData;
      })

      .catch((error) => {
        console.error(`SOAP FAIL: ${error}`);
      });
  };

  /**
   * Server'dan şarkıları çeker
   * @param {object} sounds indirilicek şarkı
   */
  DownloadSoundFromServer = async (sounds, downloadType = "sound") => {
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
        this.setState({ ...this, currentDownloadedSong: sounds?.Ismi });

        //Listeyi boşalt ve çal
        this.setState({ ...this, audioFiles: [] });

        //TODO: START
        // await this.getAudioFiles();
        //await this.playyyy();
      }
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

        let theGrader =
          anonsResult[0].length > anonsResult[1].length ? true : false;
        let theLooper = theGrader ? anonsResult[0] : anonsResult[1];

        const pretty_anons = [];
        try {
          for (let i = 0; i < theLooper.length; i++) {
            //LoperGorevler
            if (!theLooper[i].Isim) {
              for (let a = 0; a < anonsResult[1].length; a++) {
                if (
                  anonsResult[0][i].GrupTanimlamaKodu ==
                  anonsResult[1][a].GrupTanimlamaKodu
                ) {
                  pretty_anons.push({
                    anons: anonsResult[0][i],
                    task: anonsResult[1][a],
                  });
                }
              }
            }
          }
        } catch (error) {
          //console.log("Bir fazla görevvv");
        }
        // console.log("--------------PRETYYY----------------------");
        // console.log(pretty_anons);

        for (let p = 0; p < pretty_anons.length; p++) {
          if (pretty_anons[p].anons != "undefined") {
            await this.DownloadSoundFromServer(pretty_anons[p].anons, "anons");
          }
        }

        //Anons array'ini oluştur.
        //console.log(pretty_anons);
        AsyncStorage.setItem("anons", JSON.stringify(pretty_anons));
        //console.log(this.state.playlist);
      })

      .catch((error) => {
        console.error(`SOAP FAIL: ${error}`);
      });
  };

  playyyy = async () => {
    //  await this.getAudioFiles();
    await this.startToPlay();
  };

  getSoundsAndAnonsFromServer = async () => {
    //Ses dosyalarını serverdan indir.
    await this.getUserGroupListFromServer();

    await this.getAllAnonsFromServer();

    //console.log(this.state.playlist);
  };

  //Aanons Realm'e bağlan
  connectToAnonsDatabaseDoc = async () => {
    //Anonslar için bir bağlantı aç
    this.state.AnonsDBConnection = await Realm.open({
      schema: [this.AnonsShema],
      deleteRealmIfMigrationNeeded: true,
    });
  };

  //Anons Tekrarlarını veri sakla.
  writeAnonsToDatabase = (anonsId, repeats = 0, localRepeat) => {
    //Check is there is any anons equal to anonsId
    try {
      let checkAnons = this.state.AnonsDBConnection.objects(
        "AnonsDocs"
      ).filtered(`anonsId=${anonsId}`)[0];

      //Anons daha önce varsa
      if (checkAnons == undefined || checkAnons == NaN) {
        this.state.AnonsDBConnection.write(() => {
          //YOKSA EKLE
          const insert = this.state.AnonsDBConnection.create("AnonsDocs", {
            _id: new BSON.ObjectID(),
            repeats: repeats,
            anonsId: anonsId,
            repeatDate: this.state.whatIsTheDate,
          });
        });
      } else {
        //Güncelleme yap

        this.state.AnonsDBConnection.write(() => {
          let anons = this.state.AnonsDBConnection.objects(
            "AnonsDocs"
          ).filtered(`anonsId=${anonsId}`)[0];
          //VAR GUNCELLE
          //Güncellemeyi en fazla serverdaki kadar yap.
          //if (anons.repeats < localRepeat + 1) {
          console.log(anons);
          if (anons.repeats) {
            anons.repeats += 1;

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
      return this.state.AnonsDBConnection.write(() => {
        const repeats = this.state.AnonsDBConnection.objects(
          "AnonsDocs"
        ).filtered(`anonsId=${anonsId}`);

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

  componentDidMount = () => {
    //Anons documations..
    this.connectToAnonsDatabaseDoc();

    //this.requestToPermissions();
    //Musiclere erişim izni all
    this.getPermission();

    //Serverdan şarkı ve anonsları al
    this.getSoundsAndAnonsFromServer();

    //Çalmaya başla..
    if (this.state.isPlaying == false) {
      //this.playyyy();
    }

    if (this.state.playbackObj == null) {
      this.setState({ ...this.state, playbackObj: new Audio.Sound() });
    }
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
      const status = await playNext(this.state.playbackObj, audio.uri);
      this.updateState(this, {
        soundObj: status,
        currentAudio: audio,
        isPlaying: true,
        currentAudioIndex: nextAudioIndex,
      });
      await storeAudioForNextOpening(audio, nextAudioIndex);
    }
  };

  startToPlay = async () => {
    const audio = this.state.audioFiles[0];

    if (audio && this.state.soundObj == null) {
      //Playlisti oynatmaya başla
      //Play#1: Şarkıyı çal. Daha önce hiç çalınmamış ise
      const playbackObj = new Audio.Sound();

      //Controllerdan çağır.
      const status = await play(playbackObj, audio.uri);
      const index = 0;

      //Yeni durumu state ata ve ilerlememesi için return'le
      this.updateState(this, {
        currentAudio: audio,
        playbackObj: playbackObj,
        soundObj: status,
        currentAudioIndex: index,

        // //Çalma-Durdurma iconları için
        // isPlaying: true,
      });

      this.setState({ ...this, isPlaying: true });

      //Slider bar için statuyü güncelle
      playbackObj.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);

      //Application açıldığında
      //son çalınna şarkıyı bulmak için kullanırı
      storeAudioForNextOpening(audio, index);
    }
  };

  /**Kontrollerdan */
  updateState = (prevState, newState = {}) => {
    this.setState({ ...prevState, ...newState });
  };

  render() {
    const {
      audioFiles,
      dataProvider,
      permissionError,
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
            alignItems: "ce nter",
            fontSize: 30,
            color: "red",
          }}
        >
          <Text>
            Ses dosyalarına erişim izni vermediniz. Ayarları gidip erişim izni
            verin.
          </Text>
        </View>
      );

    return (
      <AudioContext.Provider
        value={{
          audioFiles,
          dataProvider,
          playbackObj,
          soundObj,
          currentAudio,
          isPlaying,
          currentAudioIndex,
          playbackPosition,
          playbackDuration,
          userData,
          getAudioFiles: this.getAudioFiles,
          newAuthContext: this.context.loadingState.userData,
          loadPreviousAudio: this.loadPreviousAudio,
          totalAudioCount: this.totalAudioCount,
          updateState: this.updateState,

          onPlaybackStatusUpdate: this.onPlaybackStatusUpdate,

          //ANONS
          anonsSoundObj: this.state.anonsSoundObj,
          currentPlayingAnons: this.state.currentPlayingAnons,
          anonsPlaylist: this.state.anonsPlaylist,
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

export default AudioProvider;
