import type { AspectKey, BodyKey, SignKey } from "./chart";

// U+FE0E asks for the text (not emoji) presentation.
const T = "︎";

export const SIGN_GLYPH: Record<SignKey, string> = {
  aries: "♈" + T,
  taurus: "♉" + T,
  gemini: "♊" + T,
  cancer: "♋" + T,
  leo: "♌" + T,
  virgo: "♍" + T,
  libra: "♎" + T,
  scorpio: "♏" + T,
  sagittarius: "♐" + T,
  capricorn: "♑" + T,
  aquarius: "♒" + T,
  pisces: "♓" + T,
};

export const BODY_GLYPH: Record<BodyKey, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀" + T,
  mars: "♂" + T,
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};

export const ASPECT_GLYPH: Record<AspectKey, string> = {
  conjunction: "☌",
  opposition: "☍",
  trine: "△",
  square: "□",
  sextile: "⚹",
};
