import React from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import color from "../misc/color";

const DownloadingGif = ({ songName }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <ActivityIndicator style={styles.spinner} color={color.RED} />
        <Text style={styles.text}>İndirme işlemi devam ediyor...</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.songName}>{songName}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: color.GREEN,
    zIndex: 8999,
    alignItems: "center",
    padding: 10,
    paddingTop: 20,
  },
  row: {
    flexDirection: "row",
  },
  text: {
    color: color.WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
  songName: {
    color: "#444",
    fontSize: 14,
  },
  spinner: {
    marginRight: 10,
  },
});

export default DownloadingGif;
