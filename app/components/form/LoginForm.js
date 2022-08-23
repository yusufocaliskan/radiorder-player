import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import Logo from "../Logo";
import Input from "./Input";
import Input from "./Button";

const LoadingForm = ({}) => {
  return (
    <View style={styles.container}>
      <StatusBar />

      <Logo styles={styles.logo} />

      <Input
        type="text"
        placeholder="Kullanıcı Adı"
        value={this.state.userName}
        setValue={(text) => this.setState({ userName: text })}
      />

      <Input
        type="secure"
        placeholder="Şifre"
        value={this.state.password}
        setValue={(text) => this.setState({ password: text })}
      />
      <Button onPress={this.LoginAction} logging={this.state.logging} />

      <View style={styles.bottomText}>
        <Text style={{ color: "#666" }}>RADIORDER KURUMSAL</Text>
      </View>
    </View>
  );
};

export default LoadingForm;
