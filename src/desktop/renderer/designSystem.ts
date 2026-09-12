export const TOLUE_DESIGN_TOKENS = Object.freeze({
  typography: Object.freeze({
    fontFamily: "Vazirmatn, Vazir, Tahoma, sans-serif",
    monoFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSizeXs: '11px',
    fontSizeSm: '12px',
    fontSizeMd: '13px',
    fontSizeLg: '16px',
    fontSizeXl: '20px',
    lineHeight: '1.55',
  }),
  spacing: Object.freeze({
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  }),
  radius: Object.freeze({
    sm: '7px',
    md: '10px',
    lg: '14px',
  }),
  color: Object.freeze({
    background: '#0b1116',
    viewport: '#071016',
    surface: '#111a22',
    surfaceMuted: '#17232d',
    surfaceElevated: '#1d2b36',
    text: '#f3f6f8',
    textMuted: '#93a5b1',
    border: '#243541',
    borderStrong: '#3c5362',
    focus: '#59b8df',
    accent: '#2498c5',
    accentHover: '#39add8',
    selection: '#f59b32',
    statusNominal: '#55c58a',
    statusWarning: '#f0b44f',
    statusCritical: '#ef6b72',
    statusUnknown: '#7f919d',
    info: '#61b7da',
  }),
} as const);

export type TolueStatusTone = 'nominal' | 'warning' | 'critical' | 'unknown';

export function statusToneColor(tone: TolueStatusTone): string {
  switch (tone) {
    case 'nominal': return TOLUE_DESIGN_TOKENS.color.statusNominal;
    case 'warning': return TOLUE_DESIGN_TOKENS.color.statusWarning;
    case 'critical': return TOLUE_DESIGN_TOKENS.color.statusCritical;
    default: return TOLUE_DESIGN_TOKENS.color.statusUnknown;
  }
}
