import React, { useContext, useEffect } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import Screen from "../components/Screen";
import color from "../misc/color";
import Slider from "@react-native-community/slider";

//Button ve Iconlar
import {
  createIconSetFromFontello,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import PlayerButton from "../components/PlayerButton";
import { AudioContext } from "../context/AudioProvider";
import { pause, play, playNext, resume } from "../misc/AudioController";
import { ComponentCompat } from "recyclerlistview";
import { storeAudioForNextOpening } from "../misc/Helper";
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

  useEffect(() => {
    context.loadPreviousAudio();
  }, []);

  //PLAY & PAUSE & RESUME
  const handlePlayPause = async () => {
    //the App runing for the first time.
    //Play#1 : İlk çalıyor.
    if (context.soundObj === null) {
      const audio = context.currentAudio;
      const status = await play(context.playbackObj, audio.uri);

      context.playbackObj.setOnPlaybackStatusUpdate(
        context.setPlaybackStatusUpdate
      );
      return context.updateState(context, {
        soundObj: status,
        shouldPlay: true,
        currentAudio: audio,
        isPlaying: true,
        currentAudioIndex: 1,
      });
    }

    //Resume#2

    if (context.soundObj && context.soundObj.isPlaying) {
      const status = await pause(context.playbackObj);
      return context.updateState(context, {
        soundObj: status,
        isPlaying: false,
      });
    }

    //Pause#3
    if (context.soundObj && !context.soundObj.isPlaying) {
      const status = await resume(context.playbackObj);
      return context.updateState(context, {
        soundObj: status,
        isPlaying: true,
      });
    }
  };

  /**
   * İleri git
   */
  const handleNext = async () => {
    const { isLoaded } = await context.playbackObj.getStatusAsync();

    const isLastAudio =
      context.currentAudioIndex + 1 === context.totalAudioCount;
    let audio = context.audioFiles[context.currentAudioIndex + 1];
    let index;
    let status;

    if (!isLoaded && !isLastAudio) {
      index = context.currentAudioIndex + 1;
      status = await play(context.playbackObj, audio.uri);
    }

    if (isLoaded && !isLastAudio) {
      index = context.currentAudioIndex + 1;
      status = await playNext(context.playbackObj, audio.uri);
    }

    if (isLastAudio) {
      index = 0;
      audio = context.audioFiles[index];
      if (isLoaded) {
        status = await playNext(context.playbackObj, audio.uri);
      } else {
        status = await play(context.playbackObj, audio.uri);
      }
    }

    context.updateState(context, {
      currentAudio: audio,
      playbackObj: context.playbackObj,
      soundObj: status,
      isPlaying: true,
      currentAudioIndex: index,
      playbackPosition: null,
      playbackDuration: null,
    });

    storeAudioForNextOpening(audio, index);
  };

  /**
   * Geri git
   */
  const handlePrevious = async () => {
    const { isLoaded } = await context.playbackObj.getStatusAsync();

    const isFirstAudio = context.currentAudioIndex <= 0;
    let audio = context.audioFiles[context.currentAudioIndex - 1];
    let index;
    let status;

    if (!isLoaded && !isFirstAudio) {
      index = context.currentAudioIndex - 1;
      status = await play(context.playbackObj, audio.uri);
    }

    if (isLoaded && !isFirstAudio) {
      index = context.currentAudioIndex - 1;
      status = await playNext(context.playbackObj, audio.uri);
    }

    if (isFirstAudio) {
      index = context.totalAudioCount - 1;

      audio = context.audioFiles[index];
      if (isLoaded) {
        status = await playNext(context.playbackObj, audio.uri);
      } else {
        status = await play(context.playbackObj, audio.uri);
      }
    }

    context.updateState(context, {
      currentAudio: audio,
      playbackObj: context.playbackObj,
      soundObj: status,
      isPlaying: true,
      currentAudioIndex: index,
      playbackPosition: null,
      playbackDuration: null,
    });

    storeAudioForNextOpening(audio, index);
  };

  //Eğer gerçerli olan bir şarkı yoksa..
  if (!context.currentAudio) return null;

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
              style={{ marginTop: 10 }}
              color={color.WHITE}
              onPress={handlePrevious}
            />
            <PlayerButton
              style={{ marginHorizontal: 30, marginBottom: 20, fontSize: 60 }}
              iconType={context.isPlaying ? "PAUSE" : "PLAY"}
              color={color.WHITE}
              onPress={handlePlayPause}
            />
            <PlayerButton
              iconType="NEXT"
              style={{ marginTop: 10 }}
              color={color.WHITE}
              onPress={handleNext}
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
