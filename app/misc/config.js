let date = new Date().toLocaleTimeString().split(":").slice(0, -1);
let date_string = `${date[0]}:${date[1]}`;

const configs = {
  SER_USERNAME: "radiorder",
  SER_PASSWORD: "1@K_#$159X!",

  //Tekrarlı anonslar arasındaki zaman dilimi.
  //Her x saate bir tekrarı yap
  /// 20 şarkıda bir tane anons ya.
  REPEAT_PERIOT_TIME: 2,

  //Tekrarlı anonslarda ilk çalma saati
  FIRST_PERIOT_TIME: "03:00",

  //SOAP QUERY
  SOAP_URL: "https://www.radiorder.online/ws/radi.asmx",

  //Login Token
  LOGIN_TOKEN: "!!+234lmfdlkmdfm23ş5+^&^+TERFew'4ewfdsf",
};

//Eğer ilk çalma saati şuanki saate küçükse
//İlk tekraralı anonusun ilk çalma saatini şimdiye +1 saate eşitle.
if (configs.FIRST_PERIOT_TIME < date_string) {
  let currentTime = new Date().getTime();
  let updatedTime = new Date(currentTime + 1 * 60 * 60 * 1000);

  configs.FIRST_PERIOT_TIME = `${parseInt(date[0])}:${parseInt(date[1])}`;
}
export default configs;
