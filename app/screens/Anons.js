import React, { useContext, useState } from "react";
import { AudioContext } from "../context/AudioContext";

import { Audio } from "expo-av";

const Anons = () => {
  /**
   * Bir anons çaldırır
   */
  play = async (audio) => {
    const playbackObj = new Audio.Sound();
    const uri = audio.uri;
  };
};

export default Anons;
