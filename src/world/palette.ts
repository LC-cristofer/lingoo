/* World palette: every colour of the Ilha-Ninho drawing lives here (the bible's palette).
   Nino's own orange stays in the Nino art, never in the world. */
export const PAL = {
  skyTop: "#7CC4EE", skyMid: "#CDEBF8", skyLow: "#FFEFD9",
  cloud: "#FFFFFF", cloudShade: "#DCEBF6",
  grass: "#86CC5E", grassLight: "#9CDA74", grassDark: "#6DB64C", grassEdge: "#559B3D",
  soil: "#C08453", soilMid: "#A46A3E", soilDark: "#84512D", soilDeep: "#6A3E22",
  path: "#F6E2B8", pathEdge: "#E3C58C",
  water: "#6CCBE3", waterDeep: "#45AECB", waterLight: "#C2EEF7",
  rock: "#CBD3DC", rockDark: "#A1ADBB", rockLight: "#E3E8EE",
  wood: "#C98A4B", woodDark: "#9C6631", woodLight: "#E2A762", woodDeep: "#7A4A26",
  stump: "#B07A4E", stumpTop: "#E3B57F", stumpRing: "#C99360",
  leaf: "#5DB55A", leafDark: "#3F8F45", leafLight: "#86CF6B",
  trunk: "#9A6A43", trunkDark: "#7A5232",
  cream: "#FFF8EC", wool: "#F6E7CF", ink: "#3A2618", shadow: "rgba(58,38,24,.16)",
  letras: "#FF7A5C", letrasDark: "#E35F45",
  numeros: "#F5B12E", numerosDark: "#D99216",
  cores: "#A57BEA", coresDark: "#8A5ED6",
  linguas: "#2E9FD8", linguasDark: "#2384B5", linguasDeep: "#23609E",
  mundo: "#2EB8A4", mundoDark: "#1F9A88",
  glow: "#FFE29A", lamp: "#FFC94A",
} as const;

/** One colour per area (spec): the same hues the places and the trail use. */
export const AREA = {
  letras: "#FF7A5C",
  numeros: "#F5B12E",
  cores: "#A57BEA",
  linguas: "#2E9FD8",
  mundo: "#2EB8A4",
  ninho: "#C98A4B",
} as const;

export type AreaId = keyof typeof AREA;
