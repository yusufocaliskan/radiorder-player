import React, { Component, useContext, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Avatar } from "@rneui/base";
import { AudioContext } from "../context/AudioProvider";
import { LayoutProvider, RecyclerListView } from "recyclerlistview";
import AudioListItem from "../components/AudioListItem";
import Screen from "../components/Screen";
import {
  updateAnonsSingRepeatTimes,
  storeAudioForNextOpening,
} from "../misc/Helper";
import AnonsModal from "../components/AnonsModal";
import ModalPlayer from "../components/ModalPlayer";
//Expo-av şarkıları çalar.
import { Audio } from "expo-av";

//Controller
import { play, pause, resume, playNext } from "../misc/AudioController";

import "react-native-get-random-values";
import Realm, { BSON } from "realm";

export class AudioList extends Component {
  static contextType = AudioContext;

  //Constructor
  constructor(props) {
    super(props);
    this.state = {
      optionModalVisible: false,
      finish: true,
    };

    this.currentItem = {};
  }

  //Ses dosyaları Layouttu.
  layoutProvider = new LayoutProvider(
    (i) => "audio",
    (type, dim) => {
      dim.width = Dimensions.get("window").width;
      dim.height = 70;
    }
  );

  /**
   * //İlkez: şarkıya çalmak için basıldığında
   * @param {object} audio
   * @returns object
   */
  handleAudioPress = async (audio) => {
    const { playbackObj, soundObj, currentAudio, updateState, audioFiles } =
      this.context;

    //Play#1: Şarkıyı çal. Daha önce hiç çalınmamış ise
    if (soundObj === null) {
      const playbackObj = new Audio.Sound();

      //Controllerdan çağır.
      const status = await play(playbackObj, audio.uri);
      const index = audioFiles.indexOf(audio);

      //Yeni durumu state ata ve ilerlememesi için return'le
      updateState(this.context, {
        currentAudio: audio,
        playbackObj: playbackObj,
        soundObj: status,
        currentAudioIndex: index,

        //Çalma-Durdurma iconları için
        isPlaying: true,
      });

      //Slider bar için statuyü güncelle
      playbackObj.setOnPlaybackStatusUpdate(
        this.context.onPlaybackStatusUpdate
      );

      //Application açıldığında
      //son çalınna şarkıyı bulmak için kullanırı
      storeAudioForNextOpening(audio, index);
    }

    //Pause#2: Şarkıyı durdur.
    if (
      soundObj != null &&
      soundObj.isLoaded &&
      soundObj.isPlaying &&
      currentAudio.id === audio.id
    ) {
      //Controller
      const status = await pause(playbackObj);

      //Yeni durumu state ata ve ilerlememesi için return'le
      return updateState(this.context, { soundObj: status, isPlaying: false });
    }

    //Resume#3 : Şarkı durdurulmuş ise yeniden çalıdrmaya devam ettir
    if (
      soundObj != null &&
      soundObj.isLoaded &&
      !soundObj.isPlaying &&
      currentAudio.id === audio.id
    ) {
      console.log(audio);
      const status = await resume(playbackObj);

      //Yeni durumu state ata ve ilerlememesi için return'le
      return updateState(this.context, {
        soundObj: status,
        isPlaying: true,
      });
    }

    //Next#4 : Başka bir şarlkıya geç
    if (
      soundObj != null &&
      soundObj.isLoaded &&
      soundObj.isPlaying &&
      currentAudio.id !== audio.id
    ) {
      const index = audioFiles.indexOf(audio);
      const status = await playNext(playbackObj, audio.uri);
      updateState(this.context, {
        currentAudio: audio,
        soundObj: status,
        isPlaying: true,
        currentAudioIndex: index,
      });
      storeAudioForNextOpening(audio, index);
    }

    if (
      soundObj != null &&
      soundObj.isLoaded &&
      !soundObj.isPlaying &&
      currentAudio.id !== audio.id
    ) {
      const index = audioFiles.indexOf(audio);
      const status = await playNext(playbackObj, audio.uri);
      updateState(this.context, {
        currentAudio: audio,
        soundObj: status,
        isPlaying: true,
        currentAudioIndex: index,
      });
      storeAudioForNextOpening(audio, index);
    }
  };

  /**
   * Bir anons çalar.
   */
  playAnons = async () => {
    setTimeout(async () => {
      const anonsPlaylist = this.context.anonsPlaylist;
      let isPlaying = null;
      console.log("--------ANONS LIST----------");
      console.log(anonsPlaylist);
      for (let i = 0; i < anonsPlaylist.length; i++) {
        //Çalan bir şarkı varsa onu durdur
        if (this.context.soundObj != null && this.context.soundObj.isPlaying) {
          pause(this.context.playbackObj);
          isPlaying = false;
        }

        //Herhangi bir anons çalmıyorsa
        if (this.context.anonsSoundObj == null) {
          const playbackObj = new Audio.Sound();

          //console.log(anonsPlaylist[5]);
          //Controllerdan çağır.
          const status = await play(playbackObj, anonsPlaylist[i].uri);

          //Anons Tekrar sayısını güncelle
          //updateAnonsSingRepeatTimes(anonsPlaylist[5].Id);
          this.context.updateState({
            ...this.context,
            isPlaying: isPlaying,
            anonsSoundObj: status,
            currentPlayingAnons: anonsPlaylist[i],
          });

          //Anons bittikten sonra tekrar durumu güncelle
          setTimeout(async () => {
            const status = await playbackObj.stopAsync({
              shouldPlay: false,
              positionMillis: false,
            });

            //Şarkıya kaldığı yerden davem ettir
            //Herhangi bir şarkı çalıyorsa
            if (
              this.context.soundObj != null &&
              this.context.soundObj.isPlaying == true
            );
            {
              resume(this.context.playbackObj);
              isPlaying = true;
            }

            //State'i güncelle
            this.context.updateState({
              ...this.context,
              anonsSoundObj: status,
              isPlaying: isPlaying,
              currentPlayingAnons: null,
            });
          }, status.durationMillis + 100);
        }
      }
    }, 1000);
  };

  componentDidMount = async () => {
    //Anonsu çal
    //this.playAnons();

    //Profile resmini koy
    this.props.navigation.setOptions({
      headerLeft: () => {
        return (
          <View style={{ marginLeft: 20 }}>
            <TouchableOpacity>
              <Avatar
                rounded
                source={{
                  uri: `http://radiorder.online/${this.context.newAuthContext?.FSL?.KullaniciListesi?.KullaniciDto?.ProfilResmi}`,
                }}
              />
            </TouchableOpacity>
          </View>
        );
      },
    });

    //TODO: Re-Check..
    //this.context.loadPreviousAudio();
    // await this.context.getAudioFiles().then(async () => {
    //   await this.startToPlay();
    // });
  };

  //Login olduğunda şarkıyı çalmaya başla..
  startToPlay = async () => {
    const { soundObj, currentAudio, updateState, audioFiles } = this.context;

    const audio = audioFiles[0];

    if (audio && soundObj == null) {
      //Playlisti oynatmaya başla
      //Play#1: Şarkıyı çal. Daha önce hiç çalınmamış ise
      const playbackObj = new Audio.Sound();

      //Controllerdan çağır.
      const status = await play(playbackObj, audio.uri);
      const index = 0;

      //Yeni durumu state ata ve ilerlememesi için return'le
      updateState(this.context, {
        currentAudio: audio,
        playbackObj: playbackObj,
        soundObj: status,
        currentAudioIndex: index,

        //Çalma-Durdurma iconları için
        isPlaying: true,
      });

      //Slider bar için statuyü güncelle
      playbackObj.setOnPlaybackStatusUpdate(
        this.context.onPlaybackStatusUpdate
      );

      //Application açıldığında
      //son çalınna şarkıyı bulmak için kullanırı
      storeAudioForNextOpening(audio, index);
    }
  };

  //Şarkıyı listele.
  rowRenderer = (type, item, index, extendedState) => {
    return (
      <AudioListItem
        title={item.filename}
        duration={item.duration}
        isPlaying={extendedState.isPlaying}
        activeListItem={this.context.currentAudioIndex === index}
        item={item}
        onAudioPress={() => this.handleAudioPress(item)}
        onOptionPress={() => {
          this.currentItem = item;
          this.setState({ ...this.state, optionModalVisible: true });
        }}
      />
    );
  };

  render() {
    return (
      <AudioContext.Consumer>
        {({ dataProvider, isPlaying, anonsSoundObj, currentPlayingAnons }) => {
          if (!dataProvider._data.length) return null;

          return (
            <>
              <Screen>
                <RecyclerListView
                  dataProvider={dataProvider}
                  layoutProvider={this.layoutProvider}
                  rowRenderer={this.rowRenderer}
                  extendedState={{ isPlaying }}
                  style={{ paddingTop: 20 }}
                />
              </Screen>
              {anonsSoundObj != null &&
              currentPlayingAnons != null &&
              anonsSoundObj.isPlaying ? (
                <AnonsModal anons={currentPlayingAnons} />
              ) : null}
            </>
          );
        }}
      </AudioContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
});

export default AudioList;
