import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import color from "../misc/color";

const PlayerButton = (props) => {
  const {
    iconType,
    size = 40,
    iconColor = color.RED,
    otherProps,
    onPress,
  } = props;

  const getIconName = (type) => {
    switch (type) {
      case "PLAY":
        return "play-circle";

      case "PAUSE":
        return "pausecircle";

      case "NEXT":
        return "forward";

      case "PREV":
        return "backward";
    }
  };

  return (
    <FontAwesome
      onPress={onPress}
      name={getIconName(iconType)}
      size={size}
      color={iconColor}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default PlayerButton;
