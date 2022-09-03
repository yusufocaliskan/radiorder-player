export const songShema = {};

//Anons Şeması
export const AnonsShema = {
  name: "AnonsTest",
  properties: {
    _id: "objectId",
    repeats: "int",
    repeatDate: "date",
    anonsId: "int",
    albumId: "int",
    creationTime: "date",
    duration: "float",
    filename: "string",
    height: "int",
    id: "int",
    mediaType: "string",
    modificationTime: "date",
    uri: "string",
    width: "int",
    Aciklama: "string",
    Aktif: "boolean",
    Baslangic: "date",
    Bitis: "date",
    Durumu: "string",
    GT: "date",
    GK: "date",
    Ismi: "string",
    GorevTipAciklama: "string",
    GorevTipi: "string",
    GrupTanimlamaKodu: "string",
    Id: "string",
    KK: "string",
    KT: "string",
    KayitBilgisi: "string",
    SecenekTipi: "string",
    Secenek: "string",
    SecenekAciklama: "string",
    Silindi: "string",
    TekrarSayisi: "int",
    FileType: "string",
    timeLineMinutes: "date",
    timeLineHours: "date",
    anonsRepeated: "int",

    //Anons Playlistte gösterilsin mi?
    Show: "boolean",
  },
};
