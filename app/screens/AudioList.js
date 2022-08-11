import React, { Component } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  LayoutAnimation,
  Dimensions,
} from "react-native";
import { AudioContext } from "../context/AudioProvider";
import { LayoutProvider, RecyclerListView } from "recyclerlistview";
import AudioListItem from "../components/AudioListItem";
import Screen from "../components/Screen";
import OptionModal from "../components/OpstionModal";

//Expo-av şarkıları çalar.
import { Audio } from "expo-av";

//Controller
import { play, pause, resume } from "../misc/AudioController";

export class AudioList extends Component {
  static contextType = AudioContext;

  //Constructor
  constructor(props) {
    super(props);
    this.state = {
      optionModalVisible: false,
      playbackObj: null,
      soundObj: null,
      currentAudio: {},
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

  //şarkıya çalmak için basıldığında
  handleAudioPress = async (audio) => {
    //Play#1: Şarkıyı çal. Daha önce hiç çalınmamış ise
    if (this.state.soundObj === null) {
      const playbackObj = new Audio.Sound();

      //Controllerdan çağır.
      const status = await play(playbackObj, audio.uri);

      //Yeni durumu state ata ve ilerlememesi için return'le
      return this.setState({
        ...this.state,
        currentAudio: audio,
        playbackObj: playbackObj,
        soundObj: status,
      });
    }

    //Pause#2: Şarkıyı durdur.
    if (this.state.soundObj.isLoaded && this.state.soundObj.isPlaying) {
      //Controller
      const status = await pause(this.state.playbackObj);

      //Yeni durumu state ata ve ilerlememesi için return'le
      return this.setState({ ...this.state, soundObj: status });
    }

    //Resume#3 : Şarkı durdurulmuş ise yeniden çalıdrmaya devam ettir
    if (
      this.state.soundObj.isLoaded &&
      !this.state.soundObj.isPlaying &&
      this.state.currentAudio.id === audio.id
    ) {
      const status = await resume(this.state.playbackObj);

      //Yeni durumu state ata ve ilerlememesi için return'le
      return this.setState({
        ...this.state,
        soundObj: status,
      });
    }
  };

  //Şarkıyı listele.
  rowRenderer = (type, item) => {
    return (
      <AudioListItem
        title={item.filename}
        duration={item.duration}
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
        {({ dataProvider }) => {
          return (
            <Screen style={{ flex: 1 }}>
              <RecyclerListView
                dataProvider={dataProvider}
                layoutProvider={this.layoutProvider}
                rowRenderer={this.rowRenderer}
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
