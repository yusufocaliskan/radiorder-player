import React, { createContext, useState, useEffect } from "react";
import { View, Text } from "react-native";

import tr from "../lang/tr";
import en from "../lang/en";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LangContext = createContext();

const LangProvider = (props) => {
  const [selectedLang, setSelectedLang] = useState();
  const [Lang, setLang] = useState();
  const Languages = {
    tr: tr,
    en: en,
  };
  useEffect(() => {
    freshSelectedLang();
  });
  const freshSelectedLang = async () => {
    let appLang = await AsyncStorage.getItem("AppLang");

    if (!appLang) {
      appLang = "tr";
    }

    setSelectedLang(appLang);
    setLang(Languages[selectedLang]);
  };
  const updateSelectedLang = async (newVal) => {
    await AsyncStorage.setItem("AppLang", newVal);
    setSelectedLang(newVal);
  };
  return (
    <LangContext.Provider
      value={{
        Lang: Lang,
        setSelectedLang: setSelectedLang,
        updateSelectedLan: updateSelectedLang,
      }}
    >
      {props.children}
    </LangContext.Provider>
  );
};

export default LangProvider;
