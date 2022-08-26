import React, { Component, useContext, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Avatar } from "@rneui/base";
import { AudioContext } from "../context/AudioProvider";
import { LayoutProvider, RecyclerListView } from "recyclerlistview";
import AudioListItem from "../components/AudioListItem";
import Screen from "../components/Screen";
import OptionModal from "../components/OpstionModal";
import { storeAudioForNextOpening } from "../misc/Helper";

//Expo-av şarkıları çalar.
import { Audio } from "expo-av";

//Controller
import { play, pause, resume, playNext } from "../misc/AudioController";

export class AudioList extends Component {
  static contextType = AudioContext;

  //Constructor
  constructor(props) {
    super(props);
    this.state = {
      optionModalVisible: false,
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
  };

  componentDidMount() {
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

    this.context.loadPreviousAudio();
  }

  //Şarkıyı listele.
  rowRenderer = (type, item, index, extendedState) => {
    return (
      <AudioListItem
        title={item.filename}
        duration={item.duration}
        isPlaying={extendedState.isPlaying}
        activeListItem={this.context.currentAudioIndex === index}
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
        {({ dataProvider, isPlaying }) => {
          if (!dataProvider._data.length) return null;

          return (
            <Screen style={{ flex: 1 }}>
              <RecyclerListView
                dataProvider={dataProvider}
                layoutProvider={this.layoutProvider}
                rowRenderer={this.rowRenderer}
                extendedState={{ isPlaying }}
              />
              <OptionModal
                onPlayPress={() => {
                  console.log("Playing!");
                }}
                onPlayListPress={() => {
                  console.log("Çalma Listesine ekledin");
                }}
                currentItem={this.currentItem}
                onClose={() =>
                  this.setState({ ...this.state, optionModalVisible: false })
                }
                visible={this.state.optionModalVisible}
              />
            </Screen>
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
  },
});

export default AudioList;
