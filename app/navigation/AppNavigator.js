import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AudioList from "../screens/AudioList";
import Player from "../screens/Player";
import PlayList from "../screens/PlayList";

//Iconları import et.
import { Entypo } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator>
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
        name="Çalma Listeleri"
        component={PlayList}
        options={{
          tabBarIcon: ({ color, size }) => {
            return <Entypo name="folder-music" size={size} color={color} />;
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
