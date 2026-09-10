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
    sm: '4px',
    md: '6px',
    lg: '8px',
  }),
  color: Object.freeze({
    background: '#161a1d',
    viewport: '#111518',
    surface: '#20262b',
    surfaceMuted: '#282f35',
    surfaceElevated: '#30383f',
    text: '#edf1f3',
    textMuted: '#9aa7af',
    border: '#3a434a',
    borderStrong: '#59646c',
    focus: '#54a6c8',
    accent: '#3f8fac',
    accentHover: '#55a7c5',
    selection: '#d49a3a',
    statusNominal: '#63b482',
    statusWarning: '#d5a44d',
    statusCritical: '#df6b6b',
    statusUnknown: '#87939b',
    info: '#66a9c7',
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
