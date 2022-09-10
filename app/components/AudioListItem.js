import React, { useContext } from "react";
import {
  TouchableWithoutFeedback,
  Dimensions,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import color from "../misc/color";
import { convertTime, TranslateTheWeekDays } from "../misc/Helper";
//Icon
import { Entypo } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { LangContext } from "../context/LangProvider";

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
  const { Lang, selectedLang } = useContext(LangContext);
  const TranslateTheWeekDays = (daysWillBeTranstlate) => {
    const translator = [];
    translator["Pazar"] = Lang?.SUNDAY;
    translator["Pazartesi"] = Lang?.MONDAY;
    translator["Salı"] = Lang?.THUESDAY;
    translator["Çarşamba"] = Lang?.WEDNESDAY;
    translator["Perşembe"] = Lang?.THURSDAY;
    translator["Cuma"] = Lang?.FRIDAY;
    translator["Cumartesi"] = Lang?.STURDAY;

    let days = daysWillBeTranstlate.split(",");

    days = days.map((v, k, x) => {
      return translator[v];
    });

    return days;
  };
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
                    <Feather name="volume-2" size={24} color={color.RED} />
                  </View>
                ) : null}

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
                    <View>
                      <Text
                        style={[
                          styles.anonsDesc,
                          { textTransform: "uppercase" },
                        ]}
                      >
                        {item.Aciklama}
                      </Text>

                      <Text style={styles.anonsDesc}>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={color.RED}
                        />{" "}
                        {Lang?.STARTING_DATE} - {item.showIt.Start}
                      </Text>
                      <Text style={styles.anonsDesc}>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={color.RED}
                        />{" "}
                        {Lang?.ENDING_DATE} - {item.showIt.End}
                      </Text>

                      <Text style={styles.anonsDesc}>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={color.RED}
                        />{" "}
                        {item.SecenekAciklama
                          ? TranslateTheWeekDays(item.SecenekAciklama).map(
                              (v, k) => {
                                return k == 6 ? `${v} ` : `${v}, `;
                              }
                            )
                          : Lang?.EVERY_DAY}
                      </Text>
                    </View>
                    <View style={styles.anonsCounterView}>
                      <Text
                        style={[
                          styles.anonsCounterText,
                          styles.anonsCounterTextFirst,
                          item.showIt.anonsRepeated == item.showIt.repeat
                            ? { backgroundColor: color.GREEN }
                            : null,
                        ]}
                      >
                        {item.showIt.anonsRepeated}
                      </Text>
                      <View style={styles.counterSeparator}></View>
                      <Text style={styles.anonsCounterText}>
                        {item.showIt.repeat}
                      </Text>
                    </View>
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
    width: width - 50,
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
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  indexOfSong: {
    position: "absolute",
    right: 5,
    top: 10,
    color: color.WHITE,
  },
  anonsCounterView: {
    position: "absolute",
    right: 0,
    top: 0,
    borderWidth: 1,
    backgroundColor: color.GRAY,
    borderRadius: 8,
  },

  anonsCounterText: {
    paddingVertical: 0,
    paddingHorizontal: 15,
    fontSize: 22,
    color: "#aaa",
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
  },
  anonsCounterTextFirst: {
    backgroundColor: color.RED,
    color: color.WHITE,
  },
  counterSeparator: {
    height: 1,
    backgroundColor: color.FONT_LARGE,
  },

  titleBottom: {
    width: width - 60,
  },
});

export default AudioListItem;
