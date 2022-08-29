import React, { Component, createContext } from "react";
import { Text, View, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import { storeAudioForNextOpening } from "../misc/Helper";
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

      //Song and Anons in the Storage
      downloadedSongs: [],

      downloadedAnons: [],

      //Playlist
      currentPlaylist: [],
    };

    this.totalAudioCount = 0;
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
   * Kullanıcı bilgilerini al.
   */
  loadUserData = async () => {
    const data = JSON.parse(await AsyncStorage.getItem("userData"));
    this.setState({ ...this.state, data });
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

    //Şarkıları state ata.
    this.setState({
      ...this.state,
      dataProvider: dataProvider.cloneWithRows([
        ...audioFiles,
        ...media.assets,
      ]),
      audioFiles: [...audioFiles, ...media.assets],
    });
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
        for (let i = 1; i <= 1; i++) {
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

              //Save it to storage
              await AsyncStorage.setItem(
                "downloadedSong",
                JSON.stringify(this.state.downloadedSongs)
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
    const soundName = `${DownloadDir}/${downloadType}_${sounds?.DosyaIsmi}`;

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
      await RNFetchBlob.config(options)
        .fetch("GET", sounds.SesLink)
        .then(() => {
          console.log("Downloads finished");
        });

      this.setState({ ...this, isDownloading: true });
      this.setState({ ...this, currentDownloadedSong: sounds?.Ismi });
      this.setState({ ...this, audioFiles: [] });
      this.getAudioFiles();

      if (this.state.isPlaying === false) {
        this.playyyy();
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
      .then((resData) => {
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
        //DownloadSoundFromServer
        const anonsResult = [];

        anonsResult[0] = allAnons.AnonsListesi.wsAnonsDto;
        anonsResult[1] = allAnons.GorevListesi.AnonsGorevTanimDto;

        const anons = [];

        //Anons ve Görevleri ayrışrır.
        for (let i = 0; i < anonsResult[0].length; i++) {
          //Anons
          const anons_group_kodu = anonsResult[0][i].GrupTanimlamaKodu;
          anons.push(anonsResult[0][i]);
        }

        for (let b = 0; b < anonsResult[1].length; b++) {
          //Anons
          anons.push(anonsResult[1][b]);
        }

        //Aynı anons ve görev tanımlamaları tek array içine at
        const pretty_anons = [];
        const anons2 = anons;
        for (let r = 0; r < anons.length; r++) {
          //Anons
          const anonsEach = anons[r];

          //Aynı koda sahip olan görevi bul
          const task = anons.find(
            (anons2) => anons2.GrupTanimlamaKodu === anons[r].GrupTanimlamaKodu
          );
          if (
            !this.lookForDublicatedIndex(
              pretty_anons,
              anonsEach.GrupTanimlamaKodu
            )
          ) {
            pretty_anons.push({
              anons: anonsEach,
              task: task,
            });
          }
        }

        //Anons array'ini oluştur.
        console.log(pretty_anons);
      })

      .catch((error) => {
        console.error(`SOAP FAIL: ${error}`);
      });
  };

  /**
   * Aynı verileri kotrol eder
   * @param {object} anons anons
   * @param {string} data
   * @returns boolean
   */
  lookForDublicatedIndex = (anons, data) => {
    for (let i = 0; i < anons.length; i++) {
      if (anons[i].anons.GrupTanimlamaKodu == data) {
        return true;
      }
    }
  };

  playyyy = async () => {
    await this.getAudioFiles();
    await this.startToPlay();
  };

  getDownloadedSongsFromStorage = async () => {
    return JSON.parse(await AsyncStorage.getItem("downloadedSong"));
  };

  componentDidMount = () => {
    //this.requestToPermissions();
    //Musiclere erişim izni all
    this.getPermission();

    console.log("----------------ANONS------------------");
    this.getAllAnonsFromServer();
    //Ses dosyalarını serverdan indir.
    this.getUserGroupListFromServer();

    console.log("-----------DOWNLOADED SONG---------");
    //this.getDownloadedSongsFromStorage();

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

  onPlaybackStatusUpdate = async (playbackStatus) => {
    //Slider için positionı update et
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
