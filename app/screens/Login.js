import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  Component,
  useContext,
} from "react";
import {
  Image,
  Text,
  View,
  Alert,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import color from "../misc/color";
import config from "../misc/config";
import Logo from "../components/Logo";
import LoadingGif from "../components/LoadingGif";
import Input from "../components/form/Input";
import Button from "../components/form/Button";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import axios from "axios";
import { newAuthContext } from "../context/newAuthContext";
import { AudioContext } from "../context/AudioProvider";
import { storeAudioForNextOpening } from "../misc/Helper";

//Expo-av şarkıları çalar.
import { Audio } from "expo-av";
import { play } from "../misc/AudioController";
//Navigator.
import { useNavigation } from "@react-navigation/native";

const Login = () => {
  // Context

  const navigation = useNavigation();
  const [userName, setUserName] = useState();
  const [password, setPassword] = useState();
  const { singIn, test } = useContext(newAuthContext);
  const audioContext = useContext(AudioContext);

  const LoginAction = async () => {
    //Kullanıcı bilgileri boş mu?

    if (userName == "" || password == "") {
      return Alert.alert("Hata", "Bilgileri yaz.", [{ text: "Tamam." }]);
    }

    const xml = `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <FirmaveKullaniciBilgileri xmlns="http://tempuri.org/">
          <SertifikaBilgileri>
          <KullaniciAdi>${config.SER_USERNAME}</KullaniciAdi>
          <Sifre>${config.SER_PASSWORD}</Sifre>
        </SertifikaBilgileri>
        <Eposta>${userName}</Eposta>
        <Sifre>${password}</Sifre>
            <MakineKodu>string</MakineKodu>
          </FirmaveKullaniciBilgileri>
        </soap:Body>
      </soap:Envelope>`;

    axios
      .post(config.SOAP_URL, xml, {
        headers: { "Content-Type": "text/xml" },
      })
      .then(async (resData) => {
        const options = {
          ignoreNameSpace: false,
          ignoreAttributes: false,
        };
        const parser = new XMLParser(options);
        const jObj = parser.parse(getSoapBody(resData.data));

        //Giriş Hatalı mı?
        if (jObj.Basarili == false) {
          Alert.alert("Hata", "Giriş yapılamadı. Bilgiler yanlış olabilir.", [
            { text: "Tamam" },
          ]);

          return false;
        }

        //Giriş başarılı mı?
        if (jObj.Basarili == true) {
          //Sayfaya gönder
          //Storage'a verileri koy
          singIn(jObj);

          //İlk şarkıdan çalmaya başla.
          //startToPlay();

          return navigation.navigate("MainApp");
        }
      })

      .catch((error) => {
        console.error(`SOAP FAIL: ${error}`);
      });
  };

  //Gelen bilgileri ayıkla
  const getSoapBody = (xmlStr) => {
    let soapBody = null;
    if (xmlStr) {
      const soapBodyRegex =
        /<FirmaveKullaniciBilgileriResult>([\s\S]*)<\/FirmaveKullaniciBilgileriResult>/im;
      const soapBodyRegexMatchResult = xmlStr.match(soapBodyRegex);
      soapBody = soapBodyRegexMatchResult[1];
    }
    return soapBody;
  };

  //Giriş yapmamış ise burayı göster.

  //Giriş yapılmamış ise giriş formunu
  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <StatusBar style="light" />

      <Logo styles={styles.logo} />
      <Input
        type="text"
        placeholder="Kullanıcı Adı"
        value={userName}
        setValue={setUserName}
      />

      <Input
        type="secure"
        placeholder="Şifre"
        value={password}
        setValue={setPassword}
      />
      <Button onPress={LoginAction} text="GİRİŞ YAP" />
      <View style={styles.bottomText}>
        <Text style={{ color: "#666" }}>RADIORDER KURUMSAL</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.BLACK,
  },

  bottomText: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  message: {
    marginBottom: 20,
  },
  messageText: {
    color: color.WHITE,
    fontSize: 16,
  },
  logo: {
    width: 200,
    marginTop: 80,
    marginBottom: 20,
    height: 200,
  },
});

export default Login;
