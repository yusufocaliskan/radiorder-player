import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

//Screens
import MainApp from "../screens/MainApp";

const Stack = createNativeStackNavigator();

const NavigationStack = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Music" component={MainApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default NavigationStack;
