let date = new Date().toLocaleTimeString().split(":").slice(0, -1);
let date_string = `${date[0]}:${date[1]}`;

const configs = {
  SER_USERNAME: "radiorder",
  SER_PASSWORD: "1@K_#$159X!",

  /// 10 şarkıda bir tane anons ya.
  HERGUN_TEKRARLI_ANONS: 40,

  //Her 20 şarkıda bir
  BELIRGUN_TEKRARLI_ANONS: 30,

  //SOAP QUERY
  SOAP_URL: "https://www.radiorder.online/ws/radi.asmx",

  //Login Token
  LOGIN_TOKEN: "!!+234lmfdlkmdfm23ş5+^&^+TERFew'4ewfdsf",
};
export default configs;
