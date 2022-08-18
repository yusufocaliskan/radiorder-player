import React from "react";
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

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
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
        options={{
          tabBarIcon: ({ color, size }) => {
            return <FontAwesome name="music" size={size} color={color} />;
          },
        }}
      />
      <Tab.Screen
        name="Müzik Çalar"
        component={Player}
        options={{
          tabBarIcon: ({ color, size }) => {
            return (
              <Ionicons name="md-headset-sharp" size={size} color={color} />
            );
          },
        }}
      />
      <Tab.Screen
        name="Kullanıcı"
        component={User}
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
