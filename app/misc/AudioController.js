//Play#1
//Şarkıyı başlatmak için kullanılır
export const play = async (playbackObj, uri) => {
  try {
    console.log("Playing");
    return await playbackObj.loadAsync({ uri }, { shouldPlay: true });
  } catch (error) {
    console.log("Hata!", error.message);
  }
};

//Pause#2
//Şarkıyı durdurmak için kullanırılır
export const pause = async (playbackObj) => {
  try {
    console.log("Paused");
    return await playbackObj.setStatusAsync({
      shouldPlay: false,
    });
  } catch (error) {
    console.log("Hata: Şarkı durdurulamadı.", error.message);
  }
};

//Resum#3
//Durdurulmuş şarkıyı yeniden başlatmak için kullanırılır
export const resume = async (playbackObj) => {
  try {
    console.log("Resumed");
    return await playbackObj.playAsync();
  } catch (error) {
    console.log("Hata! Şarkı durdurulamadı.", error.message);
  }
};

//Başka bir şarkıya geç
