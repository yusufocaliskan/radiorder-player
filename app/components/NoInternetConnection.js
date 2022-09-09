import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import color from "../misc/color";
import { useNetInfo } from "@react-native-community/netinfo";

/**
 * Sağ üstte internet yok yazısı göstermek için kullanılır.
 */
export default NoInternetConnection = ({ text }) => {
  const netInfo = useNetInfo();

  if (netInfo.isConnected == true) {
    return null;
  }
  return (
    <View style={styles.internetInfo}>
      <Ionicons name="cloud-offline" size={20} color={color.BLACK} />
      <Text style={styles.internetInfoText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  internetInfo: {
    marginRight: 20,
    backgroundColor: color.YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 2,
    paddingBottom: 3,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  internetInfoText: {
    color: color.BLACK,
    marginLeft: 10,
  },
});
