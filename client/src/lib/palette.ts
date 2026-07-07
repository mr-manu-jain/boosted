// Validated categorical palette (dataviz reference instance).
// The light hex is the canonical value stored on a project; the dark variant
// is the same hue re-stepped for the dark surface.
export interface PaletteSlot {
  name: string;
  light: string;
  dark: string;
}

export const PROJECT_PALETTE: PaletteSlot[] = [
  { name: 'Blue', light: '#2a78d6', dark: '#3987e5' },
  { name: 'Aqua', light: '#1baf7a', dark: '#199e70' },
  { name: 'Yellow', light: '#eda100', dark: '#c98500' },
  { name: 'Green', light: '#008300', dark: '#008300' },
  { name: 'Violet', light: '#4a3aa7', dark: '#9085e9' },
  { name: 'Red', light: '#e34948', dark: '#e66767' },
  { name: 'Magenta', light: '#e87ba4', dark: '#d55181' },
  { name: 'Orange', light: '#eb6834', dark: '#d95926' },
];

const darkByLight = new Map(PROJECT_PALETTE.map((s) => [s.light, s.dark]));

/** Resolve a stored project color for the active theme. */
export function themedColor(storedHex: string, theme: 'light' | 'dark'): string {
  if (theme === 'dark') {
    return darkByLight.get(storedHex) ?? storedHex;
  }
  return storedHex;
}
