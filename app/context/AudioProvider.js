import React, { Component, createContext } from "react";
import { Text, View, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import { playNext } from "../misc/AudioController";
//Şarkıları listelemek için kullanırlır
//ScrollView'den daha performanlısdır.
import { DataProvider } from "recyclerlistview";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AudioContext = createContext();
export class AudioProvider extends Component {
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
      console.log(canAskAgain);

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

  componentDidMount() {
    this.getPermission();

    if (this.state.playbackObj == null) {
      this.setState({ ...this.state, playbackObj: new Audio.Sound() });
    }
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
          loadPreviousAudio: this.loadPreviousAudio,
          totalAudioCount: this.totalAudioCount,
          updateState: this.updateState,
          onPlaybackStatusUpdate: this.onPlaybackStatusUpdate,
        }}
      >
        {this.props.children}
      </AudioContext.Provider>
    );
  }
}

export default AudioProvider;
