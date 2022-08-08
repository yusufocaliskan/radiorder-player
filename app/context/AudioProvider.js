import React, { Component, createContext } from "react";
import { Text, View, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";

export const AudioContext = createContext();
export class AudioProvider extends Component {
  constructor(props) {
    super(props);
  }

  //Hata mesajı göster.
  permissionAlert = () => {
    Alert.alert(
      "Şarkılara erişim izni verilmek zorunlu.",
      "Uygulama izne ihtiyaç duyar.",
      [
        { text: "Tamam, izin ver.", onPress: this.getPermission() },
        { text: "Hayır", onPress: this.permissionAlert() },
      ]
    );
  };
  /**
   * Kullanıcıdan şarkılarına erişim izni iste
   */
  getPermission = async () => {
    /**
   * Object {
    "canAskAgain": true,
    "expires": "never",
    "granted": false,
    "status": "undetermined",
    } 
   */

    /**
     * Şarkı dosyalarını al.
     */
    getAudioFiles = async () => {
      const media = await MediaLibrary.getAssetsAsync({ mediaType: "audio" });
      console.log(media);
    };

    //Erişim al.
    const permission = await MediaLibrary.getPermissionsAsync();

    //İzin verildiy mi?
    if (permission.granted) {
      //izin verildi tüm şarkıları aall
      this.getAudioFiles();
    }

    //İzin verilmedi ama yeniden sorulabilir.
    //O zaman soralım!
    if (!permission.granted && permission.canAskAgain) {
      const { status, canAskAgain } =
        await MediaLibrary.requestPermissionsAsync();
      console.log(canAskAgain);

      //Bize izin vermedi!
      if (status === "denied" && canAskAgain) {
        //Bir hata göster
        this.permissionAlert();
      }

      //Izin verildi..
      if (status === "granted") {
        //Tüm şarkıları all..
        this.getAudioFiles();
      }

      //izin verilmedi ve yeniden sormamızı mı engelledi!!
      if (status === "denied" && !canAskAgain) {
        //Ona bir şeyler söyle..
      }
    }
  };

  componentDidMount() {
    this.getPermission();
  }
  render() {
    return (
      <AudioContext.Provider value={{}}>
        {this.props.children}
      </AudioContext.Provider>
    );
  }
}

export default AudioProvider;