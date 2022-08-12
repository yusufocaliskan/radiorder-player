import React, { useContext } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import Screen from "../components/Screen";
import color from "../misc/color";
import Slider from "@react-native-community/slider";

//Button ve Iconlar
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PlayerButton from "../components/PlayerButton";
import { AudioContext } from "../context/AudioProvider";
const { width } = Dimensions.get("window");

//Müzik Çalar Ekranı
const Player = () => {
  const context = useContext(AudioContext);
  const { playbackPosition, playbackDuration } = context;

  //Slider position'ın hesapla
  const calculateSeebBar = () => {
    if (playbackPosition !== null && playbackDuration !== null) {
      return playbackPosition / playbackDuration;
    }
    return 0;
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.audioCount}>{`${context.currentAudioIndex + 1} / ${
          context.totalAudioCount
        }`}</Text>
        <View style={styles.midBannerContainer}>
          <MaterialCommunityIcons
            name="music-circle-outline"
            size={300}
            color={context.isPlaying ? color.RED : color.GRAY}
          />
        </View>
        <View style={styles.audioPlayerContainer}>
          <Text numberOfLines={1} style={styles.audioName}>
            {context.currentAudio.filename}
          </Text>
          <Slider
            style={{ width: width, height: 20, padding: 20 }}
            minimumValue={0}
            maximumValue={1}
            value={calculateSeebBar()}
            minimumTrackTintColor={color.DARK_RED}
            maximumTrackTintColor={color.FONT_MEDIUM}
            thumbTintColor={context.isPlaying ? color.RED : color.GRAY}
          />
          <View style={styles.audioControllers}>
            <PlayerButton
              iconType="PREV"
              style={{ marginTop: 20 }}
              color={context.isPlaying ? color.RED : color.GRAY}
            />
            <PlayerButton
              style={{ marginHorizontal: 30, marginBottom: 20, fontSize: 80 }}
              iconType={context.isPlaying ? "PAUSE" : "PLAY"}
              color={context.isPlaying ? color.RED : color.GRAY}
            />
            <PlayerButton
              iconType="NEXT"
              style={{ marginTop: 20 }}
              color={context.isPlaying ? color.RED : color.GRAY}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  audioPlayerContainer: {},

  audioCount: {
    textAlign: "right",
    padding: 15,
    color: color.FONT_LIGHT,
  },

  midBannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  audioName: {
    color: color.WHITE,
    padding: 25,
    paddingBottom: 0,
    fontSize: 16,
  },
  sliderThumb: {
    color: "red",
    height: 5,
  },

  audioControllers: {
    width: width,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 20,
  },
});

export default Player;
