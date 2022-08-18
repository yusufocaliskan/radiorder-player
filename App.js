import NavigationStack from "./app/navigation/NavigationStack";
import AppNavigator from "./app/navigation/AppNavigator";
import { NavigationContainer } from "@react-navigation/native";
import AudioProvider from "./app/context/AudioProvider";
import User from "./app/screens/User";
import Login from "./app/screens/Login";

export default function App() {
  return (
    // <AudioProvider>
    //   <NavigationContainer>
    //     <AppNavigator />
    //   </NavigationContainer>
    // </AudioProvider>
    <NavigationContainer>
      <Login />
    </NavigationContainer>
  );
}
