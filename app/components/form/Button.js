import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import color from "../../misc/color";
const Button = ({ onPress }) => {
  return (
    <View>
      <View style={styles.formField}>
        <Pressable onPress={onPress} style={styles.Button}>
          <Text style={styles.ButtonText}>GİRİŞ YAP</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formField: {
    position: "relative",
    marginBottom: 30,
  },

  Button: {
    borderRadius: 25,
    color: "red",
    backgroundColor: color.RED,
    padding: 15,
    fontSize: 40,
    alignItems: "center",
    width: 200,
  },
  ButtonText: {
    color: color.WHITE,
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default Button;
