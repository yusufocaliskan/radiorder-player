import AppNavigator from "../navigation/AppNavigator";
import { NavigationContainer } from "@react-navigation/native";
import AudioProvider from "../context/AudioProvider";
import User from "./User";
import Login from "./Login";
import { View, Text } from "react-native";

export default function App() {
  return (
    // <AudioProvider>
    //   <NavigationContainer>
    //     <AppNavigator />
    //   </NavigationContainer>
    // </AudioProvider>
    <View>
      <Text>Silav!</Text>
    </View>
  );
}
