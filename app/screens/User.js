import React, { Component } from "react";
import { View, StyleSheet, Text, Image } from "react-native";
import Screen from "../components/Screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthProvider";
import Button from "../components/form/Button";
import { newAuthContext } from "../context/newAuthContext";
import color from "../misc/color";

class User extends Component {
  static contextType = newAuthContext;
  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
  }
  async componentDidMount() {
    this.setState({
      ...this.state,
      data: JSON.parse(await AsyncStorage.getItem("userData")),
    });
  }

  render() {
    if (this.state.data) {
      const a = this.state.data.Ismi;
      return (
        <Screen>
          <View style={styles.container}>
            <Image
              source={{ uri: "http://radiorder.online/File/Profil/nopic.png" }}
              style={styles.userImage}
            />
            <Text style={styles.userName}>{this.state.data.Ismi}</Text>
            <Button
              style={styles.logOutButton}
              onPress={this.context.singOut}
              text="Çıkış Yap"
              textStyle={styles.buttonTextStyle}
            />
          </View>
        </Screen>
      );
    }

    return <View></View>;
  }
}

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
  userImage: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 5,
    borderColor: color.RED,
  },

  userName: {
    color: "white",
    fontSize: 20,
    marginVertical: 20,
  },
  logOutButton: { backgroundColor: color.WHITE, marginTop: 50 },
  buttonTextStyle: { color: color.RED },
});

export default User;
