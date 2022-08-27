import React, { useState, useContext, useEffect, useLayoutEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";
import AudioList from "../screens/AudioList";
import Player from "../screens/Player";
import User from "../screens/User";
import color from "../misc/color";

//Iconları import et.
import { Entypo } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { AudioContext } from "../context/AudioProvider";
import { newAuthContext } from "../context/newAuthContext";

const Tab = createBottomTabNavigator();
const AppNavigator = () => {
  const context = useContext(AudioContext);
  const { loadingState } = useContext(newAuthContext);
  const [userData, setUserData] = useState(loadingState?.userData?.FSL);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: color.WHITE,
        tabBarInactiveTintColor: color.DARK_RED,
        headerStyle: { backgroundColor: color.RED },
        headerTintColor: color.WHITE,
        tabBarStyle: {
          backgroundColor: color.RED,
        },
      }}
    >
      <Tab.Screen
        name="Şarkılar"
        component={AudioList}
        context={context}
        options={{
          tabBarIcon: ({ color, size }) => {
            return <FontAwesome name="music" size={size} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Müzik Çalar"
        component={Player}
        context={context}
        options={{
          tabBarIcon: ({ color, size }) => {
            return (
              <Ionicons name="md-headset-sharp" size={size} color={color} />
            );
          },
        }}
      />
      <Tab.Screen
        name={userData?.FSL?.Ismi || "Kullanıcı"}
        component={User}
        context={context}
        options={{
          tabBarIcon: ({ color, size }) => {
            return <Entypo name="user" size={size} color={color} />;
          },
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tab: {
    backgroundColor: "blue",
  },
});

export default AppNavigator;
