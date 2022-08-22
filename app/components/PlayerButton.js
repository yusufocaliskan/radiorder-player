import React, { useState } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import color from "../misc/color";

const PlayerButton = (props) => {
  const {
    iconType,
    size = 40,
    iconColor = color.RED,
    otherProps,
    onPress,
  } = props;

  const [bgColor, setBgColor] = useState();
  console.log(bgColor);

  const getIconName = (type) => {
    switch (type) {
      case "PLAY":
        return "play-circle";

      case "PAUSE":
        return "pause-circle";

      case "NEXT":
        return "step-forward";

      case "PREV":
        return "step-backward";
    }
  };
  const setColor = () => {
    setBgColor(color.GRAY);
    setTimeout(() => {
      setBgColor(null);
    }, 200);
  };
  console.log("---" + bgColor);
  return (
    <TouchableOpacity
      onPressIn={setColor}
      style={[styles.buttonStyle, { backgroundColor: bgColor }]}
    >
      <FontAwesome5
        onPress={onPress}
        onPressIn={setColor}
        name={getIconName(iconType)}
        size={size}
        color={iconColor}
        {...props}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {},
  buttonStyle: {
    borderRadius: 200,
    width: 80,
    height: 80,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PlayerButton;
