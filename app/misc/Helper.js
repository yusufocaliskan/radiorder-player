import AsyncStorage from "@react-native-async-storage/async-storage";

//Application ilk açıldığında son çalınan şarkıyı
//Yeniden seçmek için kullanılır.
export const storeAudioForNextOpening = (audio, index) => {
  AsyncStorage.setItem("previousAudio", JSON.stringify({ audio, index }));
};
