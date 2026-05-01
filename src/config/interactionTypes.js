const INTERACTION_TYPES = Object.freeze({
  HUG: "hug",
  PAT: "pat",
  KISS: "kiss",
  CUDDLE: "cuddle",
  POKE: "poke",
  FEED: "feed",
  BITE: "bite",
  SLAP: "slap",
  PUNCH: "punch",
  BONK: "bonk",
  HANDHOLD: "handhold"
});

const INTERACTION_DEFINITIONS = Object.freeze({
  [INTERACTION_TYPES.HUG]: {
    name: INTERACTION_TYPES.HUG,
    description: "Abraza a otro usuario del servidor.",
    actionLabel: "abrazos",
    responseText: "ha abrazado a",
    color: 0xff8fab,
    apiCategory: "hug",
    fallbackGifUrl: "https://media.giphy.com/media/hJyWJLOaqgxHO/giphy.gif"
  },
  [INTERACTION_TYPES.PAT]: {
    name: INTERACTION_TYPES.PAT,
    description: "Le da una palmada en la cabeza a otro usuario.",
    actionLabel: "palmadas",
    responseText: "ha acariciado a",
    color: 0xf6bd60,
    apiCategory: "pat",
    fallbackGifUrl: "https://media.giphy.com/media/Akkiue2Uucone/giphy.gif"
  },
  [INTERACTION_TYPES.KISS]: {
    name: INTERACTION_TYPES.KISS,
    description: "Le da un beso a otro usuario.",
    actionLabel: "besos",
    responseText: "ha besado a",
    color: 0xff5d8f,
    apiCategory: "kiss",
    fallbackGifUrl: "https://media.giphy.com/media/gjORpgytEkOnVyMr0D/giphy.gif"
  },
  [INTERACTION_TYPES.CUDDLE]: {
    name: INTERACTION_TYPES.CUDDLE,
    description: "Se acurruca con otro usuario.",
    actionLabel: "mimos",
    responseText: "se ha acurrucado con",
    color: 0x84dcc6,
    apiCategory: "cuddle",
    fallbackGifUrl: "https://media.giphy.com/media/uWBgDgyBk9lWLXGAC0/giphy.gif"
  },
  [INTERACTION_TYPES.POKE]: {
    name: INTERACTION_TYPES.POKE,
    description: "Pincha a otro usuario para llamar su atencion.",
    actionLabel: "toques",
    responseText: "ha pinchado a",
    color: 0x90be6d,
    apiCategory: "poke",
    fallbackGifUrl: "https://media.giphy.com/media/d6dsbV47TzLW8lxBFT/giphy.gif"
  },
  [INTERACTION_TYPES.FEED]: {
    name: INTERACTION_TYPES.FEED,
    description: "Le da comida a otro usuario.",
    actionLabel: "comidas compartidas",
    responseText: "ha alimentado a",
    color: 0xf9c74f,
    apiCategory: "feed",
    fallbackGifUrl: "https://media.giphy.com/media/4uJ4K5UBLqa7tGHVjX/giphy.gif"
  },
  [INTERACTION_TYPES.BITE]: {
    name: INTERACTION_TYPES.BITE,
    description: "Muerde a otro usuario de forma juguetona.",
    actionLabel: "mordidas",
    responseText: "ha mordido a",
    color: 0xf3722c,
    apiCategory: "bite",
    fallbackGifUrl: "https://media.giphy.com/media/RJwAL5aTEhopZhS1Ms/giphy.gif"
  },
  [INTERACTION_TYPES.SLAP]: {
    name: INTERACTION_TYPES.SLAP,
    description: "Le da una bofetada amistosa a otro usuario.",
    actionLabel: "bofetadas",
    responseText: "ha abofeteado a",
    color: 0xf94144,
    apiCategory: "slap",
    fallbackGifUrl: "https://media.giphy.com/media/iMCedi21L9MXg1gN43/giphy.gif"
  },
  [INTERACTION_TYPES.PUNCH]: {
    name: INTERACTION_TYPES.PUNCH,
    description: "Le da un golpe a otro usuario.",
    actionLabel: "golpes",
    responseText: "ha golpeado a",
    color: 0x9b5de5,
    apiCategory: "punch",
    fallbackGifUrl: "https://media.giphy.com/media/xUA7b4LNqswUGX2REs/giphy.gif"
  },
  [INTERACTION_TYPES.BONK]: {
    name: INTERACTION_TYPES.BONK,
    description: "Le da un bonk a otro usuario.",
    actionLabel: "bonks",
    responseText: "le ha dado un bonk a",
    color: 0x577590,
    apiCategory: "bonk",
    fallbackGifUrl: "https://media.giphy.com/media/LMxyZFyXXJGGzaARVC/giphy.gif"
  },
  [INTERACTION_TYPES.HANDHOLD]: {
    name: INTERACTION_TYPES.HANDHOLD,
    description: "Toma la mano de otro usuario.",
    actionLabel: "tomadas de la mano",
    responseText: "ha tomado de la mano a",
    color: 0x43aa8b,
    apiCategory: "handhold",
    fallbackGifUrl: "https://media.giphy.com/media/JnrSCgMzstYXrhSvts/giphy.gif"
  }
});

module.exports = {
  INTERACTION_TYPES,
  INTERACTION_DEFINITIONS
};
