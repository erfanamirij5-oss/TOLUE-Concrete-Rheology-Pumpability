export const TOLUE_DESIGN_TOKENS = Object.freeze({
  typography: Object.freeze({
    fontFamily: "Vazirmatn, Vazir, Tahoma, sans-serif",
    monoFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSizeSm: '12px',
    fontSizeMd: '14px',
    fontSizeLg: '18px',
    fontSizeXl: '26px',
    lineHeight: '1.8',
  }),
  spacing: Object.freeze({
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '32px',
  }),
  radius: Object.freeze({
    sm: '8px',
    md: '12px',
    lg: '18px',
  }),
  color: Object.freeze({
    background: '#f4f5f2',
    surface: '#ffffff',
    surfaceMuted: '#eef1ee',
    text: '#172635',
    textMuted: '#526575',
    border: '#d7ddda',
    focus: '#315f78',
    statusNominal: '#2f6f4f',
    statusWarning: '#8a5a00',
    statusCritical: '#8f2f2f',
    statusUnknown: '#66727a',
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
