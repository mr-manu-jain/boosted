// Chart chrome tokens (dataviz reference palette) as literal hexes —
// Nivo needs concrete values, and these must match styles/globals.css.
type Mode = 'light' | 'dark';

export const chartChrome: Record<
  Mode,
  {
    surface: string;
    empty: string;
    muted: string;
    grid: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    shadow: string;
  }
> = {
  light: {
    surface: '#fcfcfb',
    empty: '#f0efec',
    muted: '#898781',
    grid: '#e1e0d9',
    textPrimary: '#0b0b0b',
    textSecondary: '#52514e',
    border: 'rgba(11, 11, 11, 0.1)',
    shadow: '0 4px 16px rgba(11,11,11,0.1)',
  },
  dark: {
    surface: '#1a1a19',
    empty: '#242422',
    muted: '#898781',
    grid: '#2c2c2a',
    textPrimary: '#ffffff',
    textSecondary: '#c3c2b7',
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: '0 4px 16px rgba(0,0,0,0.45)',
  },
};

// Sequential blue ramp (one hue, magnitude by lightness). The near-zero step
// recedes toward each mode's surface.
export const heatmapRamp: Record<Mode, string[]> = {
  light: ['#cde2fb', '#9ec5f4', '#5598e7', '#2a78d6', '#184f95'],
  dark: ['#104281', '#1c5cab', '#256abf', '#3987e5', '#86b6ef'],
};

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Nivo theme object for the active mode. */
export function nivoTheme(mode: Mode) {
  const c = chartChrome[mode];
  return {
    text: { fontFamily: FONT, fontSize: 11, fill: c.muted },
    axis: {
      domain: { line: { stroke: 'transparent' } },
      ticks: {
        line: { stroke: 'transparent' },
        text: { fill: c.muted, fontSize: 10.5, fontFamily: FONT },
      },
      legend: { text: { fill: c.textSecondary, fontSize: 11, fontFamily: FONT } },
    },
    grid: { line: { stroke: c.grid, strokeWidth: 1 } },
    labels: { text: { fontFamily: FONT } },
    tooltip: {
      container: {
        background: c.surface,
        color: c.textPrimary,
        fontFamily: FONT,
        fontSize: 12,
        borderRadius: 10,
        boxShadow: c.shadow,
        border: `1px solid ${c.border}`,
        padding: '8px 12px',
      },
    },
  };
}
