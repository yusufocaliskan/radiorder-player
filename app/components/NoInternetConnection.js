import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import color from "../misc/color";
import { useNetInfo } from "@react-native-community/netinfo";

/**
 * Sağ üstte internet yok yazısı göstermek için kullanılır.
 */
export default NoInternetConnection = () => {
  const netInfo = useNetInfo();

  if (netInfo.isConnected == true) {
    return null;
  }
  return (
    <View style={styles.internetInfo}>
      <Ionicons name="cloud-offline" size={22} color="black" />
      <Text style={styles.internetInfoText}>Internetiniz Yok</Text>
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
    fontWeight: "bold",
    marginLeft: 10,
  },
});
