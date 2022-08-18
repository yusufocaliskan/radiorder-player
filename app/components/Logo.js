import React from "react";
import { Image } from "react-native";
import Logo from "../images/logo.png";

const Logo = () => {
  return <Image source={Logo} resizeMode="contain" />;
};

export default Logo;
