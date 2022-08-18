import React, { useState } from "react";
import {
  StatusBar,
  Image,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import color from "../misc/color";
import Logo from "../images/logo.png";
import Input from "../components/form/Input";
import Button from "../components/form/Button";

//Navigator.
import { useNavigation } from "@react-navigation/native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";

const Login = () => {
  //Navigation

  //Logo için yükseklik değerini al
  const { height } = useWindowDimensions();

  //Değişkenleri tanımla
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const LoginAction = () => {
    
    navigation.navigate("MainApp");
  };

  //Giriş Yap buttonuna basıldığında

  return (
    <View style={styles.container}>
      <StatusBar />
      <Image
        source={Logo}
        resizeMode="contain"
        //Ekranin %30'u
        style={[styles.logo, { height: height * 0.3 }]}
      />
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
      <Button onPress={LoginAction} />

      <View style={styles.bottomText}>
        <Text style={{ color: "#666" }}>RADIORDER KURUMSAL</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: color.BLACK,
  },

  logo: {
    width: 200,
    marginBottom: 20,
  },
  bottomText: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
});

export default Login;
