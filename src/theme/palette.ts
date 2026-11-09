// The kopi palette in one place. tokens.css mirrors these values; the build-time
// dither art reads them from here so PNGs and CSS never drift apart.
export const PALETTE = {
  light: {
    bg: '#F4EADB', // condensed-milk cream
    surface: '#FBF5EA',
    raised: '#FFFDF8',
    sunk: '#EADDC8',
    ink: '#2B1B12', // espresso
    ink2: '#5E4A3C',
    muted: '#6F5B4C',
    hair: '#CDBBA2',
    clay: '#D97757', // terracotta, matches the video tutor
    clayDeep: '#9A3F24',
    claySoft: '#F3D5C5',
    sage: '#3D6A4B',
    sageSoft: '#D5E6D8',
    red: '#A3362A',
    redSoft: '#F4D3CC',
    gold: '#8A5E08',
    goldFill: '#E0A93B',
  },
  dark: {
    bg: '#1A110C',
    surface: '#241812',
    raised: '#2F2018',
    sunk: '#120B07',
    ink: '#F3E7D3',
    ink2: '#D6C4AB',
    muted: '#B9A48A',
    hair: '#4A3628',
    clay: '#E58B68',
    clayDeep: '#E58B68',
    claySoft: '#4A2A1E',
    sage: '#8FC09B',
    sageSoft: '#22382A',
    red: '#F0907F',
    redSoft: '#47211B',
    gold: '#E7B85A',
    goldFill: '#E0A93B',
  },
} as const;

export type ThemeName = keyof typeof PALETTE;
