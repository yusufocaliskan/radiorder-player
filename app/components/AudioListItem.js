import React from "react";
import { Dimensions, View, StyleSheet, Text } from "react-native";
import color from "../misc/color";

//Icon
import { Entypo } from "@expo/vector-icons";

const AudioListItem = () => {
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailText}>A</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text numberOfLines={1} style={styles.title}>
            A Song Song Song Song Song Song Song Song Song text!
          </Text>
        </View>
      </View>
      <View style={styles.rightContainer}>
        <Entypo
          name="dots-three-vertical"
          size={20}
          color={color.FONT_MEDIUM}
        />
      </View>
    </View>
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
    backgroundColor: color.FONT_LIGHT,
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
});

export default AudioListItem;
