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
import { convertTime } from "../misc/Helper";
//Icon
import { Entypo } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
//Şarkının ilk harfını al.
const getThumnailText = (filename) => filename[0];

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
  style,
  keyy,
}) => {
  //console.log("---------------ITEM----------------");
  //  console.log(item);
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={onAudioPress} style={style}>
          <View style={styles.leftContainer}>
            {item.FileType != "anons" ? (
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
                  {activeListItem ? renderIcon(isPlaying) : keyy}
                </Text>
              </View>
            ) : null}
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
                    {item.FileType == "audio"
                      ? item.Ismi?.split("_")[1]
                      : item.Ismi}
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
                  <View>
                    <Text style={styles.anonsDesc}>{item.Aciklama}</Text>
                    <Text style={styles.anonsDesc}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={color.FONT_LIGHT}
                      />{" "}
                      Bir Sonraki Anons: {item.showIt.lastAnonsRepeatTime}
                    </Text>
                    <Text style={styles.anonsDesc}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={color.FONT_LIGHT}
                      />{" "}
                      Son Anons Saati: {item.showIt.lastAnonsRepeatTime}
                    </Text>

                    <Text style={styles.anonsDesc}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={color.FONT_LIGHT}
                      />{" "}
                      Başlangıç {item.showIt.Start}
                    </Text>
                    <Text style={styles.anonsDesc}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={color.FONT_LIGHT}
                      />{" "}
                      Bitiş {item.showIt.End}
                    </Text>

                    <Text style={styles.anonsDesc}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={color.FONT_LIGHT}
                      />{" "}
                      {`Bu gün ${item.showIt.anonsRepeated} kez anons yapıldı`}
                    </Text>
                    <Text style={styles.anonsDesc}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={color.FONT_LIGHT}
                      />{" "}
                      {!item.SecenekAciklama
                        ? `${item.showIt.repeat} kez anons yapılıcak`
                        : item.SecenekAciklama.split(",").map((x) => `${x} `)}
                    </Text>
                  </View>
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
    fontSize: 18,
    color: color.FONT_LIGHT,
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
    color: "#999",
    marginTop: 4,
  },
  indexOfSong: {
    position: "absolute",
    right: 5,
    top: 10,
    color: color.WHITE,
  },
});

export default AudioListItem;
