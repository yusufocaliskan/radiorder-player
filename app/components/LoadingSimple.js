import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import color from "../misc/color";

const LoadingSimple = () => {
  const height = useWindowDimensions();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignContent: "center",
        textAlign: "center",
        backgroundColor: color.APP_BG,
      }}
    >
      <ActivityIndicator color={color.WHITE} size="large" />

      <Text
        style={{
          textAlign: "center",
          marginTop: 15,
          fontSize: 16,
          color: color.WHITE,
        }}
      >
        Playlist yüklenirken biraz zaman alabilir...
      </Text>
    </View>
  );
};

export default LoadingSimple;
