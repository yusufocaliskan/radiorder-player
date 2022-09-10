import React, { useContext } from "react";
import { StyleSheet, View, Text } from "react-native";
import NoInternetConnection from "./NoInternetConnection";
import { getHoursAndMinutes } from "../misc/Helper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import color from "../misc/color";
import { MaterialIcons } from "@expo/vector-icons";
import { LangContext } from "../context/LangProvider";

const HeaderRight = ({ lastPlaylistUpdateTime }) => {
  const { Lang } = useContext(LangContext);
  return (
    <View style={styles.headerRight}>
      <View style={styles.updateView}>
        <MaterialIcons name="update" size={18} color={color.BLACK} />
        <Text style={styles.updateText}>
          {getHoursAndMinutes({ date: lastPlaylistUpdateTime })}
        </Text>
      </View>
      <NoInternetConnection text={Lang?.NO_INTERNET} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateView: {
    flexDirection: "row",
    backgroundColor: color.LIGHT_RED,
    alignItems: "center",
    marginRight: 10,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  updateText: {
    color: color.BLACK,
    marginLeft: 5,
  },
});

export default HeaderRight;
