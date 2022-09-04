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
  REPEAT_PERIOT_TIME: 120000,

  //Tekrarlı anonslarda ilk çalma saati
  FIRST_PERIOT_TIME: "03:00",

  //SOAP QUERY
  SOAP_URL: "https://www.radiorder.online/ws/radi.asmx",

  //Login Token
  LOGIN_TOKEN: "!!+234lmfdlkmdfm23ş5+^&^+TERFew'4ewfdsf",
};

//Eğer ilk çalma saati şuanki saate küçükse
//İlk tekraralı anonusun ilk çalma saatini şimdiye eşitle.
if (configs.FIRST_PERIOT_TIME < date_string) {
  configs.FIRST_PERIOT_TIME = `${parseInt(date[0])}:${parseInt(date[1])}`;
}
export default configs;
