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

  //şarkıya çalmak için basıldığında
  handleAudioPress = (audio) => {
    const playbackObj = new Audio.Sound();
    const status = await playbackObj.loadAsync({ uri: audio.uri }, { shouldPlay: true });
    console.log(status)
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
