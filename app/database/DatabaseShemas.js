export const songShema = {};

//Anons Şeması
export const AnonsShema = {
  name: "AnonsDocs",
  properties: {
    _id: "objectId",
    repeats: "int",
    anonsId: "int",
    anonsName: "string",
    repeatDate: "mixed",
    date: "mixed",
    anonsType: "string",
  },
};

export const AppSettings = {
  name: "AppSettings",
  properties: {
    _id: "objectId",
    AudioFilePermission: "mixed",
  },
};
