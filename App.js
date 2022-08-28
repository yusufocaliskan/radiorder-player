import React, { useContext, useMemo, useEffect, useReducer } from "react";
import NavigationStack from "./app/navigation/NavigationStack";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { AudioProvider, AudioContext } from "./app/context/AudioProvider";
import AppNavigator from "./app/navigation/AppNavigator";
import LoadingGif from "./app/components/LoadingGif";
import { newAuthContext } from "./app/context/newAuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const initialLoginState = {
    isLoading: true,
    userName: null,
    userToken: null,
    userData: null,
  };

  //REducerları oluştur..
  const loginReducer = (prevState, action) => {
    switch (action.type) {
      //İlk defa giriş yapılıyorsa
      case "RE_TOKEN":
        return {
          ...prevState,
          userToken: action.token,
          isLoading: false,
          userData: action.data,
        };

      //Kullanıcı giriş
      case "LOGIN":
        return {
          ...prevState,
          userID: action.id,
          userToken: action.token,
          isLoading: false,
          userData: action.data,
        };

      //Çıkış yaptığında
      case "LOGOUT":
        return {
          ...prevState,
          userToken: null,
          userName: null,
          isLoading: false,
        };
    }
  };

  const [loadingState, dispatch] = useReducer(loginReducer, initialLoginState);

  const authContext = useMemo(() => ({
    //Giriş yaptığında alınacak bilgler
    singIn: async (data) => {
      try {
        await AsyncStorage.setItem(
          "userToken",
          data.FSL.KullaniciListesi.KullaniciDto.Sifre
        );

        await AsyncStorage.setItem("userData", JSON.stringify(data));
      } catch (e) {
        console.log(e);
      }

      dispatch({
        type: "LOGIN",
        data: data,
        id: data.FSL.Id,
        token: data.FSL.KullaniciListesi.KullaniciDto.Sifre,
      });
    },

    //Çıkış yaptığında
    singOut: async () => {
      try {
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("userData");
      } catch (e) {
        console.log(e);
      }
      dispatch({ type: "LOGOUT", id: null, token: null });
    },

    //Kullanıcı bilgileri
    loadingState: loadingState,
  }));

  useEffect(() => {
    setTimeout(async () => {
      let userToken = null;
      let userData = null;
      try {
        userToken = await AsyncStorage.getItem("userToken");
        userData = JSON.parse(await AsyncStorage.getItem("userData"));

        dispatch({
          type: "LOGIN",
          isLoading: true,
          token: userToken,
          data: userData,
        });
      } catch (e) {
        console.log(e);
      }
    }, 3000);
  }, []);

  if (loadingState.isLoading) {
    return <LoadingGif />;
  }

  return (
    <newAuthContext.Provider value={authContext}>
      <NavigationContainer>
        <AudioProvider>
          {loadingState.userToken == null ? (
            <NavigationStack />
          ) : (
            <AppNavigator />
          )}
        </AudioProvider>
      </NavigationContainer>
    </newAuthContext.Provider>
  );
}
