import React from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import Screen from "../components/Screen";
import color from "../misc/color";
import Slider from "@react-native-community/slider";

//Button ve Iconlar
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PlayerButton from "../components/PlayerButton";

const { width } = Dimensions.get("window");
const Player = () => {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.audioCount}>1/99</Text>
        <View style={styles.midBannerContainer}>
          <MaterialCommunityIcons
            name="music-circle-outline"
            size={300}
            color={color.RED}
          />
        </View>
        <View style={styles.audioPlayerContainer}>
          <Text numberOfLines={1} style={styles.audioName}>
            Audio File Name
          </Text>
          <Slider
            style={{ width: width, height: 20, padding: 20 }}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={color.DARK_RED}
            maximumTrackTintColor={color.FONT_MEDIUM}
            thumbTintColor={color.RED}
          />
          <View style={styles.audioControllers}>
            <PlayerButton iconType="PREV" />
            <PlayerButton
              style={{ marginHorizontal: 30, marginBottom: 20 }}
              iconType="PLAY"
            />
            <PlayerButton iconType="NEXT" />
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
  audioPlayerContainer: {
    paddingHorizontal: 10,
  },

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
