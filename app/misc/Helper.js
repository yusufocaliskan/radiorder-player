import AsyncStorage from "@react-native-async-storage/async-storage";

//Application ilk açıldığında son çalınan şarkıyı
//Yeniden seçmek için kullanılır.
export const storeAudioForNextOpening = async (audio, index) => {
  await AsyncStorage.setItem("previousAudio", JSON.stringify({ audio, index }));
};

export const getCurrentDate = (customDate, separator = "-") => {
  let newDate = new Date();
  if (customDate) {
    newDate = customDate;
  }
  let date_raw = newDate.getDate();
  let month_raw = newDate.getMonth();
  if (!customDate) {
    month_raw = newDate.getMonth() + 1;
  }
  let year = newDate.getFullYear();
  var date, month;

  if (date_raw < 10) {
    date = "0" + date_raw.toString();
  } else {
    date = date_raw.toString();
  }
  if (month_raw < 10) {
    month = "0" + month_raw.toString();
  } else {
    month = month_raw.toString();
  }

  return `${year}${separator}${month}${separator}${date}`;
};

//Karıştır
export const shuffleArray = (array) => {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};

export const devideEqualParts = (num, parts) => {
  return [...Array(parts)].map((_, i) => 0 | (num / parts + (i < num % parts)));
};

export const convertTime = (minutes) => {
  if (minutes) {
    const hrs = minutes / 60;
    const minute = hrs.toString().split(".")[0];
    const percent = parseInt(hrs.toString().split(".")[1].slice(0, 2));
    const sec = Math.ceil((60 * percent) / 100);

    if (parseInt(minute) < 10 && sec < 10) {
      return `0${minute}:0${sec}`;
    }

    if (parseInt(minute) < 10) {
      return `0${minute}:${sec}`;
    }
    return `${minute}:${sec}`;
  }
};
