import React, { useEffect, useContext, useState } from "react";
import { AudioContext } from "../context/AudioProvider";
import {
  FlatList,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Screen from "../components/Screen";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { newAuthContext } from "../context/newAuthContext";
import { Avatar } from "@rneui/base";
import { LayoutProvider, RecyclerListView } from "recyclerlistview";
import AudioListItem from "../components/AudioListItem";
import color from "../misc/color";

const Anons = () => {
  const audioContext = useContext(AudioContext);
  const { singOut, loadingState } = useContext(newAuthContext);
  const navigation = useNavigation();

  //Moun olduğuında
  useEffect(() => {
    //Mount olduğunda verileri storagetan al.
    //Üstte profile avatarın koy.
    // navigation.setOptions({
    //   headerLeft: () => {
    //     return (
    //       <View style={{ marginLeft: 20 }}>
    //         <TouchableOpacity>
    //           <Avatar
    //             rounded
    //             source={{
    //               uri: `http://radiorder.online/${loadingState.userData?.FSL?.KullaniciListesi?.KullaniciDto?.ProfilResmi}`,
    //             }}
    //           />
    //         </TouchableOpacity>
    //       </View>
    //     );
    //   },
    // });
  });

  /**
   * Bir anons çaldırır
   */
  const layoutProvider = new LayoutProvider(
    (i) => "audio",
    (type, dim) => {
      dim.width = Dimensions.get("window").width;
      dim.height = 70;
    }
  );
  return (
    <AudioContext.Consumer>
      {({ anonsPlaylist }) => {
        return (
          <Screen>
            <FlatList
              style={styles.anonsList}
              data={anonsPlaylist}
              keyExtractor={(item, index) => String(index)}
              renderItem={({ item, index }) => (
                <AudioListItem
                  title={item.filename}
                  duration={item.duration}
                  item={item}
                  style={styles.audioItem}
                />
              )}
            />
          </Screen>
        );
      }}
    </AudioContext.Consumer>
  );
};

const styles = StyleSheet.create({
  anonsList: {
    paddingBottom: 50,
  },
  audioItem: { paddingTop: 10 },
});

export default Anons;
