import React, { PureComponent, createContext } from "react";
import { Text, StyleSheet, View, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import NetInfo from "@react-native-community/netinfo";
//import CodePush from "react-native-code-push";
//import { NativeModules } from "react-native";

import { Audio } from "expo-av";
import {
  issetInArray,
  getCurrentDate,
  storeAudioForNextOpening,
  getDifferenceBetweenTwoHours,
  convertSecondToMillisecond,
  convertHourToMilliseconds,
  clearFileName,
} from "../misc/Helper";
import RNFetchBlob from "rn-fetch-blob";
import DownloadingGif from "../components/DownloadingGif";
import { stop, play, pause, resume, playNext } from "../misc/AudioController";

//Şarkıları listelemek için kullanırlır
//ScrollView'den daha performanlısdır.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";
import config from "../misc/config";
import { newAuthContext } from "../context/newAuthContext";
import { v4 as uuidv4 } from "uuid";
import "react-native-get-random-values";
import Realm, { BSON } from "realm";
import {
  AnonsShema,
  AnonsDocs,
  AppSettings,
  AdminSettings,
  ListenedSongShema,
} from "../database/DatabaseShemas";

//Test Anonslar
//import TestAnons from "../TestAnons";
import color from "../misc/color";
export const AudioContext = createContext();

export class AudioProvider extends PureComponent {
  static contextType = newAuthContext;

  constructor(props) {
    super(props);

    this.state = {
      //Kullanıcı bilgileri
      username: null,
      password: null,

      debug: null,
      //Mediadan alınan şarkılar
      audioFiles: [],
      anonsFiles: [],
      mediaFiles: [],

      //Permission hataları
      permissionError: false,

      //Şarkı listesi
      dataProvider: null,

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
      playListCrossChecking: false,
      currentDownloadedSong: "",
      currentSongNumber: null,
      waitLittleBitStillDownloading: false,

      //Şarkı listesi
      dataProvider: null,

      //songs
      songs: [],
      pageNo: 1,
      flatListCurrentScrollPossion: 0,
      flatListScrollIndex: 0,

      //AllAnons
      anons: [],
      anonsSoundObj: null,
      currentAnons: null,
      currentAnonsName: null,
      currentPlayingAnons: null,
      anonsIsPlaying: false,

      //Song and Anons in the Storage
      downloadedSongs: [],
      downloadedAnons: [],
      theDownloadedPage: 0,

      //Playlist
      currentPlaylist: [],
      anonsPlaylist: [],

      //Anons Database bağlantısı
      DBConnection: null,
      AppSettingsConnection: null,

      //How Many song singged
      ListenedSongCount: 1,
      theSongListened: [],
      theTimePastedSinceAnonsLoopStart: 0,

      //Updates
      noAnyNewUpdateInserver: false,

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
      noInternetConnection: false,
    };

    this.totalAudioCount = 0;
    this.totalAnonsCount = 0;
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
    this.setState({ ...this.state.state, currentAudio, currentAudioIndex });
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
      this.setState({ ...this.state.state, permissionError: true });
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
        this.setState({ ...this.state.state, permissionError: true });
        this.savePermission("denied");
      }

      //izin verilmedi ve yeniden sormamızı mı engelledi!!
      if (status === "denied" && !canAskAgain) {
        //Ona bir şeyler söyle..
        this.setState({ ...this.state.state, permissionError: true });
        this.savePermission("denied");
      }
    }
  };

  getMediaFiles = async () => {
    let media;
    media = await MediaLibrary.getAssetsAsync({ mediaType: "audio" });
    media = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: media.totalCount,
    });

    //Save it to cache
    //AsyncStorage.setItem("mediaFiles", JSON.stringify(media));
    return media;
  };

  /**
   * Şarkı dosyalarını al.
   */
  getAudioFiles = async () => {
    //Ses telefona indirilen/Download dosyaları
    const media = await this.getMediaFiles();

    this.totalAudioCount = this.state.audioFiles.length;
    this.state.mediaFiles = media.assets;

    //Eğer inter yoksa..
    //Direk cache'den all..
    if (this.state.noInternetConnection) {
      console.log(
        "-------------Songs Files: NO Connection Cache---------------------"
      );
      this.state.audioFiles = JSON.parse(await AsyncStorage.getItem("songs"));
      return;
    }

    //Şarkıları da al.
    const songs = this.state.songs;
    const filtered_song = [];
    console.log("Songs: ", this.state.songs.length);
    //Ses
    let d = 0;
    for (; d < songs?.length; d++) {
      const dosya_name = `sound_${clearFileName(songs[d].DosyaIsmi)}`;

      //Dosya eşini bul.
      let storageFile;
      media.assets.map((item) => {
        if (dosya_name == item.filename) {
          storageFile = item;
        }
      });

      //Push etmeden önce kontrol et push edeceğimiz ses var mı?
      filtered_song.push({
        albumId: storageFile?.albumId,
        creationTime: storageFile?.creationTime,
        duration: storageFile?.duration,
        filename: storageFile?.filename,
        height: storageFile?.height,
        id: storageFile?.id,
        mediaType: storageFile?.mediaType,
        modificationTime: storageFile?.modificationTime,
        uri: storageFile?.uri,
        width: storageFile?.width,
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
        Order: d,
      });
    }

    //push it into the state
    this.setState({
      ...this.state,
      audioFiles: [...filtered_song],
    });

    //Listeyi Cache at.
    await AsyncStorage.setItem("songs", JSON.stringify(filtered_song));
  };

  /**
   * Anons Dosyalarını al ve belirle
   */
  getAnonsFiles = async () => {
    let media = await this.getMediaFiles();

    this.totalAnonsCount = this.state.anonsFiles.length;

    //Serverdan gelen anonslar
    const anons = this.state.anons;

    //const anons = TestAnons;
    //Çalma sayısını al - şuana kadar kaç şarkı çaldı?
    await this.getListenedSongCount();
    let ListenedSongCount = this.state.ListenedSongCount;

    //Gösterilecek anonsları tutar
    let anons_must_be_shown = [];

    //Döngüye sok, çalma saatlerini belirle
    for (let a = 0; a < anons?.length; a++) {
      const start = getCurrentDate(
        new Date(anons[a].task.Baslangic.split("T")[0])
      );

      const end = getCurrentDate(new Date(anons[a].task.Bitis.split("T")[0]));
      const today = getCurrentDate().split("T")[0];
      const repeatServer = anons[a].task.TekrarSayisi || 1;
      const option = anons[a].task.Secenek
        ? anons[a].task.Secenek.split(",")
        : [];
      const anonsHours = anons[a].task.Baslangic.split("T")[1].split(":")[0];
      const anonsMinutes = anons[a].task.Baslangic.split("T")[1].split(":")[1];
      const currentHours = new Date().getHours();
      const currentMinutes = new Date().getMinutes();
      const optionType = anons[a].task.SecenekTipi.split(",");
      const currentDay = new Date().getDay();

      let singItToday = issetInArray(option, currentDay);

      const AnonsRepeats = this.getAnonRepeatsFromDatabase(anons[a].anons.Id);

      let lastAnonsRepeatByAnonsType = {};

      //Bu anons çalınması gerekiyor mu?
      //Şartları kontrol et.
      let isAnonsShowable = false;
      let AnonsType = ""; //Spesifik, HergunTekrarli /
      let CategoryLength = ""; //Spesifik, HergunTekrarli /

      //Anons saati var m?
      //Haftalık mı çalınacak?
      //Sepesifik saatler için
      if (option.length != 0) {
        AnonsType = "Spesifik";
        isAnonsShowable =
          today >= start &&
          today <= end &&
          singItToday == true &&
          currentHours == anonsHours &&
          currentMinutes == anonsMinutes &&
          AnonsRepeats.repeats < repeatServer;
      }

      //Her gün bir kaç kez tekrar-tekrar çalacak olan anonslar
      if (anonsHours == "00" && anonsMinutes == "00" && option.length == 0) {
        //Anons tipini belirle
        AnonsType = "HergunTekrarli";
        CategoryLength = await this.getAnonsCountByTypeName(AnonsType);
        lastAnonsRepeatByAnonsType =
          await this.getAnonRepeatsFromDatabaseByAnonsType(AnonsType);

        //Koşulu belirle
        //Anons çalsın mı?
        isAnonsShowable =
          today >= start &&
          today <= end &&
          AnonsRepeats.repeats < repeatServer &&
          ListenedSongCount > 0 &&
          //Son çalınan anonsun üzerinden x kadar geçti ise.
          //Onun katlarını çal, her on şarkıda bir
          ListenedSongCount % config.HERGUN_TEKRARLI_ANONS == 0;

        if (CategoryLength > 1) {
          isAnonsShowable =
            today >= start &&
            today <= end &&
            AnonsRepeats.repeats < repeatServer &&
            ListenedSongCount > 0 &&
            //Son çaldığın olmasın
            lastAnonsRepeatByAnonsType.anonsId != anons[a].anons.Id &&
            //Son çalınan anonsun üzerinden x kadar geçti ise.
            //Onun katlarını çal, her on şarkıda bir
            ListenedSongCount % config.HERGUN_TEKRARLI_ANONS == 0;
        }
      }

      //BeliriGunlerTekrarli
      if (anonsHours == "00" && anonsMinutes == "00" && option.length != 0) {
        //Anons tipi
        AnonsType = "BeliriGunlerTekrarli";
        CategoryLength = await this.getAnonsCountByTypeName(AnonsType);
        lastAnonsRepeatByAnonsType =
          await this.getAnonRepeatsFromDatabaseByAnonsType(AnonsType);

        isAnonsShowable =
          today >= start &&
          today >= end &&
          singItToday == true &&
          AnonsRepeats.repeats < repeatServer &&
          ListenedSongCount > 0 &&
          //lastAnonsRepeatByAnonsType.anonsId != anons[a].anons.Id &&
          //Enson  çaldığın kendin olmayaacaaann
          ListenedSongCount % config.BELIRGUN_TEKRARLI_ANONS == 0;

        //Bir denf fazla BeliriGunlerTekrarli kategorisinde anons varsa
        //Çalma id'sini de vbak
        if (CategoryLength > 1)
          isAnonsShowable =
            today >= start &&
            today >= end &&
            singItToday == true &&
            AnonsRepeats.repeats < repeatServer &&
            ListenedSongCount > 0 &&
            lastAnonsRepeatByAnonsType.anonsId != anons[a].anons.Id &&
            //Enson  çaldığın kendin olmayaacaaann
            ListenedSongCount % config.BELIRGUN_TEKRARLI_ANONS == 0;
      }

      // console.log(
      //   CategoryLength,
      //   AnonsType,
      //   anons[a].anons.AnonsIsmi,
      //   "Start: ",
      //   today >= start,
      //   "End: ",
      //   today <= end,
      //   "Expired: ",
      //   today >= end && today >= start,
      //   "repeat",
      //   AnonsRepeats.repeats < repeatServer,
      //   "ListenedSong: ",
      //   ListenedSongCount > 0,
      //   //Son çaldığın olmasın
      //   "LastId: ",
      //   lastAnonsRepeatByAnonsType.anonsId != anons[a].anons.Id,
      //   //Son çalınan anonsun üzerinden x kadar geçti ise.
      //   //Onun katlarını çal, her on şarkıda bir
      //   "Mod: ",
      //   ListenedSongCount % config.HERGUN_TEKRARLI_ANONS == 0,
      //   "start",
      //   start,
      //   "today",
      //   today,
      //   "end",
      //   end
      // );

      //Çoğunlukla debug için...
      const showIt = {
        AnonsName: anons[a].anons.AnonsIsmi,
        Start: start,
        Today: today,
        End: end,
        Expired: today >= start && today >= end,
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
        AnonsType: AnonsType,
        Id: anons[a].anons.Id,
        ListenedSongCount: ListenedSongCount,
        lastAnonsRepeatByAnonsType: lastAnonsRepeatByAnonsType,
        CategoryLength: CategoryLength,
      };

      //Dosya eşini bul.
      //Strorage taki file
      const dosya_name = `anons_${clearFileName(anons[a].anons.DosyaIsmi)}`;
      let storageFile;
      media.assets.map((item) => {
        if (dosya_name == item.filename) {
          storageFile = item;
        }
      });

      const anons_container = {
        albumId: storageFile?.albumId,
        creationTime: storageFile?.creationTime,
        duration: storageFile?.duration,
        filename: storageFile?.filename,
        height: storageFile?.height,
        id: storageFile?.id,
        mediaType: storageFile?.mediaType,
        modificationTime: storageFile?.modificationTime,
        uri: storageFile?.uri,
        width: storageFile?.width,
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
        AnonsType: AnonsType,
        timeLineMinutes: 0,
        timeLineHours: 0,
        anonsRepeated: AnonsRepeats.repeats,

        //Anons Playlistte gösterilsin mi?
        Show: isAnonsShowable,
        showIt: showIt,
      };

      //Sort et...
      // anons_must_be_shown.sort((a, b) =>
      //   a.showIt.lastAnonsRepeatTime > b.showIt.lastAnonsRepeatTime ? 1 : -1
      // );

      anons_must_be_shown.push(anons_container);

      //Save to the database |OR| update it
      this.insertAnonsById(anons_container);
      //console.log(showIt);
    }
    //console.log(anons_must_be_shown);
    setTimeout(() => {
      this.setState({
        ...this.state,
        anonsFiles: anons_must_be_shown,
      });
    }, 500);

    await AsyncStorage.setItem("anons", JSON.stringify(anons_must_be_shown));
  };

  /**
   * Internet yoksa, şarkı listesini Storage'tan al.
   * //Ve çalll
   */
  ifThereIsNOOInternet = async (forSongs = false) => {
    NetInfo.fetch().then(async (connection) => {
      try {
        //Heger ki internet yoksammm
        if (!connection.isConnected) {
          //TODO:START
          //Listeyi güncelle

          // this.state.audioFiles = JSON.parse(
          //   await AsyncStorage.getItem("songs")
          // );
          if (forSongs) {
            this.setState({ ...this.state, noInternetConnection: true });
            await this.getAudioFiles().then(() => {
              this.startToPlay();
            });
          }

          //Anonslar
          this.state.anonsFiles = JSON.parse(
            await AsyncStorage.getItem("anons")
          );
          //  await this.getAnonsFiles();
        } else {
          this.setState({ ...this.state, noInternetConnection: false });
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

          this.setState({
            ...this.state.state,
            totalSongInTheServer: parsedData,
          });
          return parsedData;
        })
        .catch((res) => {
          //Internet yoksa
          console.log("....no internet...");
          //this.ifThereIsNOOInternet();
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
    //this.getUserInfo();
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

          this.getAllSongs(
            userGroupInfoFromServer.WsGrupPlaylistDto.GrupTanimlamaKodu,
            username,
            password,
            this.state.pageNo
          );

          //Son güncelleme tarihini sakla
          //Kullanacağız
          AsyncStorage.setItem(
            "Last_Playlist_Update_Time",
            this.state.whatIsTheDate
          );
        })
        .catch(async (res) => {
          //heger kiii internet yokksaam :)
          console.log(
            "------------------SONGS:Internet Yok-------------------"
          );
          this.ifThereIsNOOInternet(true);
        });
    } catch (error) {
      console.log("Heee");
      console.error(`SOAP FAIL: ${error}`);
    }
  };

  //Her çağrıldığında pageNo state'ni bir arttırıp serverdan şarkı alır.
  LoadMoreSongs = async () => {
    //Eğer son sayfa değilse yüklemeye devam et canısı
    this.setState({ ...this.state, debug: "Çalıştııı" });
    this.setState({ ...this.state.state, pageNo: this.state.pageNo + 1 });
    if (this.state.pageNo <= this.state.totalSongInTheServer.ToplamSayfa) {
      //Sayfa sayını bir atttır ve gell.
      //await this.getAllSongsFilteringCacheControl();
      await this.getUserGroupListFromServer();

      //.................Son sayfa............
    } else {
      //Son sayfa geldiğinde kullanılmayan dosyaları sillll gitsin..
      //this.state.pageNo = 1;
      //Dinlenme sayısını sıfırla
      this.removeListenedSongCount();

      this.setState({ ...this.state.state, audioFiles: [] });

      await this.getAudioFiles();

      //Kullanılmayan şarkıları dosyadan sil
      // await this.theSongCleaner()

      //Sayfa numarasını 1 eşitle
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
          this.setState({ ...this.state, playListCrossChecking: true });
          //Hepsini indir.
          for (let i = 0; i <= parsedData.Liste.WsSarkiDto.length; i++) {
            //Push it into the array

            //Serverdan cihaza indir.
            if (parsedData?.Liste?.WsSarkiDto[i]) {
              //Download işlemini başlat
              await this.DownloadSongsFromServer(
                parsedData.Liste.WsSarkiDto[i],
                "sound",
                pageNo
              );

              this.setState({
                ...this.state,
                songs: [...this.state.songs, parsedData.Liste.WsSarkiDto[i]],
              });
              //Bu sayfa da
              //Download işlemi bittikten sonra Çalma Listesini güncelle
              if (i == parsedData.Liste.WsSarkiDto.length - 1) {
                //Download işlemi bitti
                this.setState({ ...this.state, isDownloading: false });
                this.setState({ ...this.state, currentDownloadedSong: "" });

                this.setState({
                  ...this.state,
                  waitLittleBitStillDownloading: true,
                });

                //Şarkı listesini yükle
                //ilk part ((10 adet)) indirildikten sonra çal
                //TODO:START

                await this.getAudioFiles();
                await this.startToPlay();
              }

              //Biraz bekledikten sonra
              //Üst-üste sorguların önünü almak içüünn
              setTimeout(() => {
                this.setState({
                  ...this.state,
                  playListCrossChecking: false,
                });
              }, 1000);

              //Tüm şarkılar indiyse
              if (pageNo == parsedData.ToplamSayfa) {
                //Download işlemi bitti!
                this.setState({
                  ...this.state,
                  waitLittleBitStillDownloading: false,
                });
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
  DownloadSongsFromServer = async (sounds, downloadType = "sound", pageNo) => {
    try {
      if (typeof sounds == undefined || sounds.length == 0 || sounds === null) {
        return;
      }

      const { DownloadDir } = RNFetchBlob.fs.dirs;

      //İsmi temizle ve yeniden oşlutiur
      let soundName = `${DownloadDir}/${downloadType}_${clearFileName(
        sounds?.DosyaIsmi
      )}`;

      //Dosya yok is indir.
      //Dosyayı daha önce indirmişsek, bir şey yapma..
      try {
        const isExist = await RNFetchBlob.fs.exists(soundName);
        if (!isExist) {
          //Şarkıyı indir..
          if (sounds?.SesLink) {
            const options = {
              fileCache: true,
              addAndroidDownloads: {
                useDownloadManager: true,
                notification: false,
                path: soundName,
                description: "Downloading.",
              },
            };
            try {
              await RNFetchBlob.config(options)
                .fetch("GET", sounds?.SesLink)
                .then((res) => {
                  return "res";
                });

              this.setState({ ...this.state, isDownloading: true });
              this.setState({
                ...this,
                currentDownloadedSong:
                  downloadType == "anons"
                    ? sounds?.AnonsIsmi
                    : sounds?.Ismi?.split("_")[1],
              });
            } catch (error) {
              console.log(error);
            }
          }
        } else {
          return "File Already exists!";
        }
      } catch (error) {
        console.log(error);
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
    // const username = this.state.username;
    // const password = this.state.password;
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

          //göre ve anonsları eşleştir.
          //Ayrı geliyorlar
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
          //setTimeout(() => {}, 1000);

          //Anonsları indir
          for (let p = 0; p < pretty_anons?.length; p++) {
            if (pretty_anons[p].anons != "undefined") {
              this.setState({ ...this.state, playListCrossChecking: true });
              await this.DownloadSongsFromServer(
                pretty_anons[p].anons,
                "anons"
              ).then(async () => {
                //Anons Download işlemi bittiyse
                if (p == pretty_anons?.length - 1) {
                  //Download işlemi bitti
                  this.setState({ ...this.state, isDownloading: false });
                  this.setState({ ...this.state, currentDownloadedSong: "" });

                  setTimeout(() => {
                    this.setState({
                      ...this.state,
                      playListCrossChecking: false,
                    });
                  }, 3000);
                }
              });
            }
          }

          //arraye ata.
          this.setState({
            ...this,
            anons: pretty_anons,
          });

          await this.getAnonsFiles();

          //Anons array'ini oluştur.
          //console.log(pretty_anons);
          //AsyncStorage.setItem("anons", JSON.stringify(pretty_anons));
          //console.log(this.state.playlist);
        })
        .catch((e) => {
          console.log(
            "------------------Anons:Internet Yok-------------------"
          );
          this.ifThereIsNOOInternet();
        });
    } catch (e) {}
  };

  //TODO: Kullanılmıyor..
  getAllSongsFilteringCacheControl = async () => {
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
    if (
      diffTime >
      //   //convertHourToMilliseconds(config.TIME_OF_GETTING_SONGS_FROM_SERVER) //5saat
      convertSecondToMillisecond(config.TIME_OF_GETTING_SONGS_FROM_SERVER) //5saat
    ) {
      console.log("-----------------HERE----- DIRECT-----------");
      await this.getUserGroupListFromServer();
    } else {
      console.log("-----------------HERE----- CACHE-----------");
      const songs = JSON.parse(await AsyncStorage.getItem("songs"));
      console.log("CACHE SONGS : ", songs.length);

      //   //TODO:START
      //   //Listeyi güncelle
      this.setState({ ...this.state.state, songs: songs });
      await this.getAudioFiles();
      //this.startToPlay();
    }
  };
  /**
   * Şarkı ve Anonsları çeker
   */
  getSoundsAndAnonsFromServer = async () => {
    //Cache controll...
    //TODO: Gerek kalmadı.. Pagegination yaptıkk...
    //await this.getAllSongsFilteringCacheControl();

    //Get songs directly
    await this.getUserGroupListFromServer();

    //Anonsları her zaman all..
    await this.getAllAnonsFromServer();
  };

  //Aanons Realm'e bağlan
  connectToAnonsDatabaseDoc = async () => {
    //Anonslar için bir bağlantı aç

    const connection = await Realm.open({
      schema: [
        AnonsDocs,
        AnonsShema,
        AppSettings,
        ListenedSongShema,
        AdminSettings,
      ],
      deleteRealmIfMigrationNeeded: true,
    });
    this.setState({ ...this.state.state, DBConnection: connection });
  };

  //Anons Tekrarlarını veri sakla.
  writeAnonsToDatabase = (
    anonsId,
    repeats = 0,
    localRepeat,
    name,
    AnonsType
  ) => {
    const date = getCurrentDate(new Date());
    //Check is there is any anons equal to anonsId
    try {
      let checkAnons = this.state.DBConnection.objects("AnonsDocs").filtered(
        `anonsId=${anonsId} && date='${date}' && anonsType='${AnonsType}'`
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
            anonsType: AnonsType,
          });
        });
      } else {
        //Güncelleme yap
        this.state.DBConnection.write(() => {
          const anons = this.state.DBConnection.objects("AnonsDocs").filtered(
            `anonsId=${anonsId} && date='${date}' && anonsType='${AnonsType}'`
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

  //Yeni bir anons Database'e ekler
  //@param anons data
  insertAnonsById = (anonsData) => {
    //Daha önce ekli değilse
    if (
      anonsData === null ||
      anonsData === undefined ||
      anonsData?.Id == "" ||
      anonsData.length <= 0
    ) {
      return;
    }

    const anonsRealm = this.state.DBConnection.objects("Anons").filtered(
      `Id=${anonsData.Id}`
    );
    if (anonsRealm.length <= 0) {
      this.state.DBConnection.write(() => {
        this.state.DBConnection.create("Anons", {
          Ismi: anonsData.AnonsIsmi,
          Id: anonsData.Id,
          AnonsType: anonsData.AnonsType,
        });
      });
    }

    //Ekliyse güncelle
    else {
      this.state.DBConnection.write(() => {
        anonsRealm.AnonsIsmi = anonsData.AnonsIsmi;
        anonsRealm.Id = anonsData.Id;
        anonsRealm.AnonsType = anonsData.AnonsType;
      });
    }
  };

  //Aynı tipten kaç tane anons var?
  getAnonsCountByTypeName = async (typeName) => {
    const type_counts = await this.state.DBConnection.objects("Anons").filtered(
      `AnonsType='${typeName}'`
    );
    return type_counts.length;
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

  //YApılmış anons tekrarlarını siler
  clearAnonsRepeatsFromDatabase = (deleteAll = false) => {
    const today = this.state.whatIsTheDate.split("T")[0];
    this.state.DBConnection.write(() => {
      let anons;

      //hepsini sil
      if (deleteAll) {
        anons = this.state.DBConnection.objects("AnonsDocs");
      }

      //Tarihe göre sil
      else {
        anons = this.state.DBConnection.objects("AnonsDocs").filtered(
          `date != '${today}'`
        );
      }
      this.state.DBConnection.delete(anons);
      anons = null;
    });
  };
  getAnonRepeatsFromDatabaseByAnonsType = (anonsType) => {
    try {
      const date = getCurrentDate(new Date());

      return this.state.DBConnection.write(() => {
        const repeats = this.state.DBConnection.objects("AnonsDocs")
          .filtered(`date='${date}' && anonsType='${anonsType}'`)
          .sorted("_id", true);
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
          //Admin ayarları
          await this.getAdminSettings().then(async () => {
            //Serverdan Şarkı listesini al
            await this.getSoundsAndAnonsFromServer();

            setInterval(async () => {
              await this.playAnons();
              //this.clearAnonsRepeatsFromDatabase(true);
              //this.removeListenedSongCount(true);
            }, convertSecondToMillisecond(40)); //Her 40 saniye de bir anons kontrollü yap

            //Temmizlik yap
            this.cleanYourSelfAsACatBroooo();
          });
        });

        //Serverdan şarkı ve anonsları al
      });
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Son güncelleme tarhini state ata.
   */
  setLastPlaylistUpdateTime = async () => {
    const lastPlaylistUpdateTime = await AsyncStorage.getItem(
      "Last_Playlist_Update_Time"
    );

    this.setState({
      ...this.state,
      lastPlaylistUpdateTime: lastPlaylistUpdateTime,
    });
  };

  getAdminSettings = async () => {
    const settings = this.state.DBConnection.objects("AdminSettings")[0];
    console.log({ settings });

    //Ayarları ata
    if (settings != void 0) {
      config.HERGUN_TEKRARLI_ANONS = settings.weeklyAnons;
      config.BELIRGUN_TEKRARLI_ANONS = settings.certainAnons;
    }

    //DAtabasi kapat
  };

  /**
   * Arkada planda çalmaya devam etmek için
   */
  keepWorkingInBackground = () => {
    //DAha önce çalan bir şarkı yoksa broo...
    Audio.setAudioModeAsync({
      // allowsRecordingIOS: false,
      staysActiveInBackground: true,
      //interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      //interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
    });
  };

  /**
   * Kullanıcı bilgiler.
   */
  getUserInfo = async () => {
    const username = await AsyncStorage.getItem("username");
    const password = await AsyncStorage.getItem("password");
    this.setState({ ...this.state, username: username, password: password });
  };

  /**
   * Çalıştığında
   */
  componentDidMount = () => {
    //Arka planda çalmağğğaa devam
    //this.keepWorkingInBackground();

    //DB Bağlantı, dosya izni ve verileri databaseden all.
    this.dbConnection();

    //Anons Kontrolü yap
    //Download işlemi tamamen bittiyse
  };

  componentWillUnmount() {
    //this.state.DBConnection.close();
    this.setState = (state, callback) => {
      return;
    };
  }

  //Slider için positionı update et
  onPlaybackStatusUpdate = async (playbackStatus) => {
    let audio;
    let status;
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

      //Şuana kadar dinlenen şarkılar
      this.state.theSongListened.push(this.state.soundObj);

      //Sonraki şarkının id'sini belirle
      const nextAudioIndex = this.state.currentAudioIndex + 1;

      //Scrollü kaydır..
      this.setState({
        ...this.state,
        flatListScrollIndex: this.state.currentAudioIndex,
      });

      //Playlistin bittimiine 3 tane kala yeni download gelsinnnnn
      if (nextAudioIndex >= this.state.audioFiles.length - 3) {
        this.LoadMoreSongs();
      }

      //Son şarkıyı bul
      //Son şarkı ise,

      if (nextAudioIndex >= this.state.audioFiles.length) {
        audio = this.state.audioFiles[0];
        status = await playNext(this.state.playbackObj, audio?.uri);
        this.updateState(this, {
          soundObj: status,
          currentAudio: audio,
          isPlaying: true,
          currentAudioIndex: 0,
        });

        //Çalma sayını sıfırla gulüüüm :)
        //Anonslar için onemmlliii
        //Çalma sayısını sil, çünkü yeniden saymay başlayacağız.
        //this.removeListenedSongCount();

        //Çalınan şarkıları sıfırla
        this.setState({ ...this.state.state, theSongListened: [] });
        return await storeAudioForNextOpening(this.state.audioFiles[0], 0);
      }

      //Eğer yukarıdaki şart geçerli değil ise sonraki şarkıya geç...
      //Ve Şarkıya geç ve çal, durumu güncelle
      audio = this.state.audioFiles[nextAudioIndex];
      status = await playNext(this.state.playbackObj, audio?.uri);
      this.updateState(this, {
        soundObj: status,
        currentAudio: audio,
        isPlaying: true,
        currentAudioIndex: nextAudioIndex,
      });
      //await storeAudioForNextOpening(audio, nextAudioIndex);
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
    const songs = this.state.DBConnection.objects("ListenedSongs")[0];
    await this.state.DBConnection.write(() => {
      if (songs === undefined) {
        this.state.DBConnection.create("ListenedSongs", {
          count: 1,
          date: this.state.whatIsTheDate.split("T")[0],
        });
      } else {
        songs.count++;
        songs.date = this.state.whatIsTheDate.split("T")[0];
      }
    });
  };

  /* bu güne ait şarkı çalma sayınısnı verır */
  getListenedSongCount = async () => {
    const today = this.state.whatIsTheDate.split("T")[0];
    const listened = await this.state.DBConnection.objects(
      "ListenedSongs"
    ).filtered(`date='${today}'`)[0];
    this.state.ListenedSongCount = listened?.count;
  };

  /**
   * Çalma sayısnı kaldırı
   */
  removeListenedSongCount = async (date = null) => {
    await this.state.DBConnection.write(() => {
      let listenedSongs = this.state.DBConnection.objects("ListenedSongs");
      // if (date) {
      //   const today = this.state.whatIsTheDate.split("T")[0];
      //   listenedSongs = this.state.DBConnection.objects("ListenedSongs").filter(
      //     `date='${today}'`
      //   );
      // }
      this.state.DBConnection.delete(listenedSongs);
    });
  };

  /**
   * Çal
   */
  startToPlay = async () => {
    //Dosya boş ise

    let timeout = 0;
    if (this.state.audioFiles.length == 0) {
      await this.getAudioFiles();
      timeout = 1000;
    }

    setTimeout(async () => {
      if (this.state.soundObj === null) {
        const audio = this.state.audioFiles[0];
        console.log("----------------- START TO PLAY -----------------");
        //Playlisti oynatmaya başla
        //Play#1: Şarkıyı çal. Daha önce hiç çalınmamış ise
        const playbackObj = new Audio.Sound();

        //Controllerdan çağır.
        const status = await play(playbackObj, audio?.uri);

        const index = 0;

        //Yeni durumu state ata ve ilerlememesi için return'le
        this.setState({
          ...this.state,
          currentAudio: audio,
          playbackObj: playbackObj,
          soundObj: status,
          currentAudioIndex: index,
          // //Çalma-Durdurma iconları için
          isPlaying: true,
        });

        //Slider bar için statuyü güncelle
        playbackObj.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);

        //Application açıldığında
        //son çalınna şarkıyı bulmak için kullanırı
        //storeAudioForNextOpening(audio, index);
      }
    }, timeout);
  };

  /**
   * Çalınacak anons var mı yok mu diye kontrol eder.
   * Varsa Çalar, 40 saniye de bir
   */
  playAnons = async () => {
    //Bazen boş dönüyor
    if (this.state.anonsFiles.length == 0) {
      await this.getAllAnonsFromServer();
    }

    setTimeout(async () => {
      await this.getAnonsFiles();
      console.log("Ev: Anons Kontrol # 1-2 / 1-2");
      let isPlaying = null;

      //console.log(this.state.anonsFiles);
      //Bir anons çalmıyorsa eğer anons yap
      if (
        this.state.anonsSoundObj != null ||
        this.state.anonsIsPlaying == true
      ) {
        return;
      }

      //VAr olan anonsları kontrol et.
      for (let i = 0; i < this.state.anonsFiles.length; i++) {
        //Herhangi bir anons çalmıyorsa
        //console.log(this.state.anonsFiles[i]);

        if (
          this.state.anonsSoundObj == null &&
          this.state.anonsFiles[i].Show == true
        ) {
          //Çalan bir şarkı varsa onu durdur
          if (this.state.soundObj != null) {
            pause(this.state.playbackObj);
            isPlaying = false;
          }
          this.setState({ ...this, debug: "vall" });
          const playbackObj = new Audio.Sound();

          //console.log(this.state.anonsFiles[5]);
          //Controllerdan çağır.
          const status = await play(playbackObj, this.state.anonsFiles[i].uri);
          this.setState({
            ...this.state,
            currentAnons: this.state.anonsFiles[i].showIt,
            currentAnonsName: this.state.anonsFiles[i].Ismi,
          });
          //Anons Tekrar sayısını güncelle
          //updateAnonsSingRepeatTimes(this.state.anonsFiles[5].Id);
          this.updateState({
            ...this,
            isPlaying: isPlaying,
            anonsSoundObj: status,
            anonsIsPlaying: true,
            currentPlayingAnons: this.state.anonsFiles[i],
          });

          //Çalma sayısını database ekle
          this.writeAnonsToDatabase(
            this.state.anonsFiles[i].Id,
            this.state.anonsFiles[i].showIt.anonsRepeated,
            this.state.anonsFiles[i].showIt.repeat,
            this.state.anonsFiles[i].showIt.AnonsName,
            this.state.anonsFiles[i].showIt.AnonsType
          );

          //Çalınan Şarkı listesini boşalt.
          this.state.theSongListened = [];

          //Anons bittikten sonra tekrar durumu güncelle
          setTimeout(async () => {
            const status = await playbackObj.stopAsync({
              shouldPlay: false,
              positionMillis: false,
            });

            //Şarkıya kaldığı yerden davem ettir
            //Herhangi bir şarkı çalıyorsa
            if (
              this.state.soundObj != null &&
              this.state.soundObj.isPlaying == true
            );
            {
              resume(this.state.playbackObj);
              isPlaying = true;
            }

            //State'i güncelle
            this.updateState({
              ...this,
              anonsSoundObj: null,
              isPlaying: isPlaying,
              anonsIsPlaying: false,
              currentPlayingAnons: null,
            });
          }, status.durationMillis + 100);
        }
      }
    }, 1000);
  };

  //Tüm müzik dosyalarını Temile
  cleanAllTheFilesDownloaded = async () => {
    const { DownloadDir } = RNFetchBlob.fs.dirs;

    for (let i = 0; this.state.songs.length; i++) {
      let soundName = `${DownloadDir}/sound_${this.state.songs[i]?.DosyaIsmi}`;
      let dirs =
        Platform.OS === "android"
          ? soundName
          : `${RNFS.DocumentDirectoryPath}/Folder_name/${soundName}`;

      const results = await RNFetchBlob.fs
        .unlink(dirs)
        .then(() => {
          this.state.songs = [];
          stop(this.state.playbackObj);
          this.state.playbackObj = [];

          return { deleted: true, deletedFileCount: this.state.songs.length };
        })
        .catch((err) => {
          return { deleted: false, deletedFileCount: 0 };
        });

      return results;
    }
  };

  //Kullanılmayan tüm müzik Dosylarını silleerr
  //Playlistteki dosyalar ve mediadaki dosyalar kkarşılaştırıp
  //Eşleşmeyeni siler
  theSongCleaner = async () => {
    const { DownloadDir } = RNFetchBlob.fs.dirs;

    setTimeout(async () => {
      // await this.getAudioFiles();
      // await this.getAnonsFiles();

      let combinedList = [...this.state.audioFiles, ...this.state.anonsFiles];

      //Silecnecek dosyaları bul be abi
      let media = this.state.mediaFiles;
      for (let i = 0; i <= media.length; i++) {
        let fileWillDeleted;
        combinedList.map((item) => {
          if (item?.filename != media[i]?.filename) {
            fileWillDeleted = item.filename;
          }
        });

        //TEmizle
        fileWillDeleted = `${DownloadDir}/${fileWillDeleted}`;
        const results = await RNFetchBlob.fs
          .unlink(fileWillDeleted)
          .then(() => {
            return { deleted: true };
          })
          .catch((err) => {
            return { deleted: false };
          });
      }

      console.log("------------CLEANING TIMEEEE---------");
    }, 2000);
  };

  //Applicationın doğru çalışması için
  //Bazı ver şeylerini sıfırlar, siler..
  cleanYourSelfAsACatBroooo = () => {
    //Mesala bir tanesi. Şarkı dinleme sayısı.
    //Bu güne ait olamyanı silelim
    this.removeListenedSongCount(true);

    //TODO: What is happening?
    this.clearAnonsRepeatsFromDatabase();
  };

  /**Kontrollerdan */
  updateState = (prevState, newState = {}) => {
    this.setState({ ...prevState, ...newState });
  };

  render() {
    const {
      audioFiles,
      anonsFiles,
      mediaFiles,
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
          anonsFiles,
          mediaFiles,
          playbackObj,
          soundObj,
          currentAudio,
          isPlaying,
          currentAudioIndex,
          playbackPosition,
          playbackDuration,
          dataProvider: dataProvider,
          userData,
          getAnonsFiles: this.getAnonsFiles,
          getAudioFiles: this.getAudioFiles,
          newAuthContext: this.context.loadingState.userData,
          loadPreviousAudio: this.loadPreviousAudio,
          totalAudioCount: this.totalAudioCount,
          updateState: this.updateState,
          isDownloading: this.state.isDownloading,
          onPlaybackStatusUpdate: this.onPlaybackStatusUpdate,
          startToPlay: this.startToPlay,
          pageNo: this.state.pageNo,
          LoadMoreSongs: this.LoadMoreSongs,
          //ANONS
          anonsSoundObj: this.state.anonsSoundObj,
          currentPlayingAnons: this.state.currentPlayingAnons,
          anonsPlaylist: this.state.anonsPlaylist,
          getSoundsAndAnonsFromServer: this.getSoundsAndAnonsFromServer,
          waitLittleBitStillDownloading:
            this.state.waitLittleBitStillDownloading,
          removeListenedSongCount: this.removeListenedSongCount,
          writeAnonsToDatabase: this.writeAnonsToDatabase,
          saveListenedSongCount: this.saveListenedSongCount,
          cleanAllTheFilesDownloaded: this.cleanAllTheFilesDownloaded,
          lastPlaylistUpdateTime: this.state.lastPlaylistUpdateTime,
          ListenedSongCount: this.state.ListenedSongCount,
          flatListCurrentScrollPossion: this.state.flatListCurrentScrollPossion,
          flatListScrollIndex: this.state.flatListScrollIndex,
          debug: this.state.debug,
          playListCrossChecking: this.state.playListCrossChecking,
          noInternetConnection: this.state.noInternetConnection,
          currentAnons: this.state.currentAnons,
          currentAnonsName: this.state.currentAnonsName,
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
