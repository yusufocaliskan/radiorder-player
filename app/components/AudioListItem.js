import React from "react";
import {
  TouchableWithoutFeedback,
  Dimensions,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  onAudioPress,
  isPlaying,
  activeListItem,
  item,
}) => {
  //console.log("---------------ITEM----------------");
  console.log(item);
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={onAudioPress}>
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
              <View style={styles.titleWithLabel}>
                {item.FileType == "anons" ? (
                  <View style={styles.anonsLabel}>
                    <Text style={styles.anonsLabelText}>Anons</Text>
                  </View>
                ) : (
                  <Text></Text>
                )}

                <View>
                  <Text numberOfLines={1} style={styles.title}>
                    {title}
                  </Text>
                </View>
              </View>
              <View style={styles.titleBottom}>
                {item.FileType == "audio" ? (
                  <Text style={styles.timeText}>{convertTime(duration)}</Text>
                ) : (
                  <></>
                )}
                {item.FileType == "anons" ? (
                  <Text style={styles.anonsDesc}>{item.Aciklama}</Text>
                ) : (
                  <></>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.rightContainer}></View>
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
    width: width - 50,
    paddingBottom: 5,
  },
  containerAnons: {},

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
    textTransform: "uppercase",
  },

  titleContainer: {
    width: width - 160,
    paddingLeft: 20,
  },

  title: {
    fontSize: 16,
    color: color.FONT,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    width: width - 60,
    marginTop: 10,
    justifyContent: "center",
    alignSelf: "center",
    opacity: 0.5,
  },
  timeText: {
    color: color.FONT_LIGHT,
    fontSize: 14,
  },
  titleWithLabel: {
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
  },
  anonsLabel: {
    backgroundColor: color.GREEN,

    paddingVertical: 0,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginRight: 10,
    paddingTop: -2,
  },
  anonsLabelText: {
    fontSize: 12,
    color: color.WHITE,
  },
  anonsDesc: {
    fontSize: 11,
    color: color.FONT_LARGE,
    marginTop: 4,
  },
});

export default AudioListItem;
