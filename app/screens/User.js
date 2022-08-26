import React, { Component, useContext, useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet, Text, Image } from "react-native";
import Screen from "../components/Screen";
import { Avatar } from "@rneui/base";
import { AudioContext } from "../context/AudioProvider";
import Button from "../components/form/Button";
import { newAuthContext } from "../context/newAuthContext";
import color from "../misc/color";
import { stop } from "../misc/AudioController";
import { useNavigation } from "@react-navigation/native";

const User = () => {
  const { singOut, loadingState } = useContext(newAuthContext);
  const audioContext = useContext(AudioContext);
  const navigation = useNavigation();

  //Moun olduğuında
  useEffect(() => {
    //Mount olduğunda verileri storagetan al.
    //Üstte profile avatarın koy.
    navigation.setOptions({
      title: loadingState.userData?.FSL?.Ismi,
      headerLeft: () => {
        return (
          <View style={{ marginLeft: 20 }}>
            <TouchableOpacity>
              <Avatar
                rounded
                source={{
                  uri: `http://radiorder.online/${loadingState.userData?.FSL?.KullaniciListesi?.KullaniciDto?.ProfilResmi}`,
                }}
              />
            </TouchableOpacity>
          </View>
        );
      },
    });
  });

  const singOutUser = async () => {
    //Çalan şarkı varsa durdur..
    const status = await stop(audioContext.playbackObj);
    audioContext.updateState(audioContext, {
      playbackObj: audioContext.playbackObj,
      soundObj: status,
      isPlaying: false,
      playbackPosition: null,
      playbackDuration: null,
    });

    singOut();
  };

  if (!loadingState.userData) {
    return (
      <View>
        <Text>VAllaa</Text>
      </View>
    );
  }
  return (
    <Screen>
      <View style={styles.container}>
        <Image
          source={{
            uri: `http://radiorder.online/${loadingState.userData?.FSL?.KullaniciListesi?.KullaniciDto?.ProfilResmi}`,
          }}
          style={styles.userImage}
        />
        <Text style={styles.userName}>{loadingState.userData?.FSL?.Ismi}</Text>
        <Text style={styles.Eposta}>
          {loadingState.userData?.FSL?.KullaniciListesi?.KullaniciDto?.Eposta}
        </Text>
        <Text style={styles.Sehir}>{loadingState.userData?.FSL?.Sehir}</Text>
        <Button
          style={styles.logOutButton}
          onPress={singOutUser}
          text="Çıkış Yap"
          textStyle={styles.buttonTextStyle}
        />
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
