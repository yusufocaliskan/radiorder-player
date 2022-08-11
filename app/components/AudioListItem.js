import React from "react";
import {
  TouchableWithoutFeedback,
  Dimensions,
  View,
  StyleSheet,
  Text,
} from "react-native";
import color from "../misc/color";

//Icon
import { Entypo } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

//Şarkının ilk harfını al.
const getThumnailText = (filename) => filename[0];

//Dakika dönüştürücü
const convertTime = (minutes) => {
  if (minutes) {
    const hrs = minutes / 60;
    const minute = hrs.toString().split(".")[0];
    const percent = parseInt(hrs.toString().split(".")[1].slice(0, 2));
    const sec = Math.ceil((60 * percent) / 100);

    if (parseInt(minute) < 10 && sec < 10) {
      return `0${minute}:0${sec}`;
    }

    if (parseInt(minute) < 10) {
      return `0${minute}:${sec}`;
    }
    return `${minute}:${sec}`;
  }
};

const renderIcon = (isPlaying) => {
  //Playing: Şarkı çalıyorlar
  if (isPlaying) {
    return <Ionicons name="pause" size={24} color="black" />;
  }

  //Paused: Şarkı durdurulmuş ise
  return <Entypo name="controller-play" size={24} color="black" />;
};

//her bir şarkıyı liste
const AudioListItem = ({
  title,
  duration,
  onOptionPress,
  onAudioPress,
  isPlaying,
  activeListItem,
}) => {
  return (
    <>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onAudioPress}>
          <View style={styles.leftContainer}>
            <View
              style={[
                styles.thumbnail,
                {
                  backgroundColor: activeListItem
                    ? color.RED
                    : color.FONT_LARGE,
                },
              ]}
            >
              <Text style={styles.thumbnailText}>
                {activeListItem
                  ? renderIcon(isPlaying)
                  : getThumnailText(title)}
              </Text>
            </View>
            <View style={styles.titleContainer}>
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
              <Text style={styles.timeText}>{convertTime(duration)}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.rightContainer}>
          <Entypo
            name="dots-three-vertical"
            size={20}
            color={color.FONT_MEDIUM}
            onPress={onOptionPress}
            style={{ padding: 10 }}
          />
        </View>
      </View>
      <View style={styles.separator}></View>
    </>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "center",
    width: width - 80,
  },

  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  rightContainer: {
    flexBasis: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnail: {
    height: 40,
    backgroundColor: color.FONT_LARGE,
    flexBasis: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },

  thumbnailText: {
    fontSize: 22,
    fontWeight: "bold",
    color: color.FONT,
  },

  titleContainer: {
    width: width - 190,
    paddingLeft: 20,
  },

  title: {
    fontSize: 16,
    color: color.FONT,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    width: width - 90,
    marginBottom: 5,
    marginTop: 5,
    justifyContent: "center",
    alignSelf: "center",
    opacity: 0.5,
  },
  timeText: {
    color: color.FONT_LIGHT,
    fontSize: 14,
  },
});

export default AudioListItem;
