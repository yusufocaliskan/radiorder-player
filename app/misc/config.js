import { gerCurrentDate } from "./Helper";
console.log("---------CONFOOOOG-------------");
let date = new Date().toLocaleTimeString().split(":").slice(0, -1);
let date_string = `${date[0]}:${date[1]}`;

const configs = {
  SER_USERNAME: "radiorder",
  SER_PASSWORD: "1@K_#$159X!",

  //Tekrarlı anonslar arasındaki zaman dilimi.
  //Her x saate bir tekrarı yap
  //Milisaniye cinsinden belirt
  // 60000 = 1dk.
  //21600000 = 6 saat
  REPEAT_PERIOT_TIME: 21600000,

  //Tekrarlı anonslarda ilk çalma saati
  FIRST_PERIOT_TIME: "10:20",

  //SOAP QUERY
  SOAP_URL: "https://www.radiorder.online/ws/radi.asmx",

  //Login Token
  LOGIN_TOKEN: "!!+234lmfdlkmdfm23ş5+^&^+TERFew'4ewfdsf",
};

//Eğer ilk çalma saati şuanki saate küçükse
//İlk tekraralı anonusun ilk çalma saatini şimdi+ 25dk ya eşitle.
if (configs.FIRST_PERIOT_TIME < date_string) {
  configs.FIRST_PERIOT_TIME = `${parseInt(date[0])}:${parseInt(date[1] + 25)}`;
}
export default configs;
