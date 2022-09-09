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

  const rowRenderer = (type, item, index, extendedState) => {
    return (
      <AudioListItem
        title={item.filename}
        duration={item.duration}
        isPlaying={extendedState.isPlaying}
        activeListItem={audioContext.currentAudioIndex === index}
        item={item}
        onAudioPress={() => this.handleAudioPress(item)}
        onOptionPress={() => {
          this.currentItem = item;
          this.setState({ ...this.state, optionModalVisible: true });
        }}
      />
    );
  };

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
              renderItem={({ item, index }) => (
                <AudioListItem
                  title={item.filename}
                  duration={item.duration}
                  //isPlaying={extendedState.isPlaying}
                  activeListItem={audioContext.currentAudioIndex === index}
                  item={item}
                  style={styles.audioItem}
                />
              )}
            />

            {/* <Screen>
              <RecyclerListView
                dataProvider={dataProvider}
                layoutProvider={layoutProvider}
                rowRenderer={rowRenderer}
                extendedState={{ isPlaying }}
                style={{ paddingTop: 20 }}
              />
            </Screen>
            {anonsSoundObj != null &&
            currentPlayingAnons != null &&
            anonsSoundObj.isPlaying ? (
              <AnonsModal anons={currentPlayingAnons} />
            ) : null}
             */}
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
