import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";
import Screen from "../components/Screen";

const User = () => {
  return (
    <Screen>
      <View style={styles.container}>
        <Text>User</Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 200,
  },
});

export default User;
