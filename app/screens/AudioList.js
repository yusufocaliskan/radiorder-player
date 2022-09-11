import React, { PureComponent } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AudioContext } from "../context/AudioProvider";
import AudioListItem from "../components/AudioListItem";
import color from "../misc/color";
import Screen from "../components/Screen";
import HeaderRight from "../components/HeaderRight";
import { storeAudioForNextOpening } from "../misc/Helper";
import AnonsModal from "../components/AnonsModal";
//Expo-av şarkıları çalar.
import { Audio } from "expo-av";

//Controller
import { play, pause, resume, playNext } from "../misc/AudioController";

import "react-native-get-random-values";
import LoadingSimple from "../components/LoadingSimple";

export class AudioList extends PureComponent {
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
      //console.log(audio);
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

  createHeader = async () => {
    const lastPlaylistUpdateTime = await AsyncStorage.getItem(
      "Last_Playlist_Update_Time"
    );
    this.props.navigation.setOptions({
      headerRight: () => {
        return <HeaderRight lastPlaylistUpdateTime={lastPlaylistUpdateTime} />;
      },
    });
  };

  componentDidMount = async () => {
    this.createHeader();
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
        keyy={index + 1}
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
        {({
          dataProvider,
          isPlaying,
          anonsSoundObj,
          currentPlayingAnons,
          audioFiles,
        }) => {
          if (!dataProvider._data.length) {
            return <LoadingSimple />;
          }
          return (
            <>
              <Screen>
                <FlatList
                  style={{ paddingTop: 20 }}
                  refreshing={() => {
                    <LoadingSimple />;
                  }}
                  data={audioFiles}
                  keyExtractor={(item, index) => String(index)}
                  renderItem={({ item, index }) => (
                    <AudioListItem
                      title={item.filename}
                      style={[
                        styles.songItem,
                        index + 1 == audioFiles.length
                          ? { marginBottom: 30 }
                          : null,
                      ]}
                      duration={item.duration}
                      isPlaying={isPlaying}
                      activeListItem={this.context.currentAudioIndex === index}
                      item={item}
                      keyy={index + 1}
                      onAudioPress={() => this.handleAudioPress(item)}
                    />
                  )}
                />

                {this.context.isDownloading ? (
                  <View style={styles.spinnerView}>
                    <ActivityIndicator
                      style={styles.spinner}
                      color={color.WHITE}
                    />
                  </View>
                ) : null}
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
  spinnerView: {
    flex: 1,
    backgroundColor: color.APP_BG,
    padding: 10,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  spinnerText: {
    color: color.WHITE,
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  songItem: {
    paddingTop: 10,
  },
});

export default AudioList;
