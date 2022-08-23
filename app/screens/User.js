import React, { Component } from "react";
import { TouchableOpacity, View, StyleSheet, Text, Image } from "react-native";
import Screen from "../components/Screen";
import { Avatar } from "@rneui/base";
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

  //Moun olduğuında
  componentDidMount = async () => {
    //Mount olduğunda verileri storagetan al.
    this.setState({
      ...this.state,
      data: JSON.parse(await AsyncStorage.getItem("userData")),
    });

    //Üstte profile avatarın koy.
    this.props.navigation.setOptions({
      title: this.state.data?.Ismi,
      headerLeft: () => {
        return (
          <View style={{ marginLeft: 20 }}>
            <TouchableOpacity>
              <Avatar
                rounded
                source={{
                  uri: `http://radiorder.online/${this.state.data?.KullaniciListesi.KullaniciDto.ProfilResmi}`,
                }}
              />
            </TouchableOpacity>
          </View>
        );
      },
    });
  };

  render() {
    return (
      <Screen>
        <View style={styles.container}>
          <Image
            source={{
              uri: `http://radiorder.online/${this.state.data?.KullaniciListesi.KullaniciDto.ProfilResmi}`,
            }}
            style={styles.userImage}
          />
          <Text style={styles.userName}>{this.state.data?.Ismi}</Text>
          <Text style={styles.Eposta}>
            {this.state.data?.KullaniciListesi.KullaniciDto.Eposta}
          </Text>
          <Text style={styles.Sehir}>{this.state.data?.Sehir}</Text>
          <Button
            style={styles.logOutButton}
            onPress={this.context.singOut}
            text="Çıkış Yap"
            textStyle={styles.buttonTextStyle}
          />
        </View>
      </Screen>
    );

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
    fontSize: 15,
    marginTop: 20,
    marginVertical: 4,
    letterSpacing: 5,
  },

  Eposta: {
    color: color.WHITE,
    fontSize: 15,
    marginVertical: 4,
    backgroundColor: color.GRAY,
    padding: 2,
    paddingHorizontal: 10,
    borderRadius: 100,
  },

  Sehir: {
    color: color.FONT_LARGE,
    fontSize: 15,
    marginVertical: 4,
  },
  logOutButton: {
    backgroundColor: color.RED,
    marginTop: 50,
    opacity: 0.5,
    padding: 5,
    width: 100,
  },
  buttonTextStyle: { color: color.WHITE },
});

export default User;
