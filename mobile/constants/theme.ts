/** Matchday palette — aligned with web `app/globals.css` oklch tokens (approx hex). */
export const colors = {
  bg: '#16160F',
  surface: '#22221A',
  surfaceElevated: '#2B2B22',
  surfaceHigh: '#333329',
  border: '#3D3D33',
  borderSubtle: '#2E2E26',

  yellow: '#E8D24A',
  yellowDim: 'rgba(232,210,74,0.14)',
  yellowGlow: 'rgba(232,210,74,0.08)',

  // Accent matches web gold (no cyan brand split)
  accent: '#E8D24A',
  accentDim: 'rgba(232,210,74,0.14)',

  white: '#F7F7F7',
  text: '#F7F7F7',
  textSecondary: '#C4C4B8',
  textMuted: '#8E8E82',
  textFaint: '#5C5C52',

  success: '#4ADE80',
  successDim: 'rgba(74,222,128,0.15)',
  error: '#EF4444',
  errorDim: 'rgba(239,68,68,0.15)',
  warning: '#F59E0B',

  overlay: 'rgba(0,0,0,0.6)',
  overlayHeavy: 'rgba(0,0,0,0.85)',
  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(255,255,255,0.08)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 28,
  full: 9999,
} as const;

export const font = {
  display: { fontSize: 48, fontWeight: '900' as const, letterSpacing: -1.5 },
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyMed: { fontSize: 16, fontWeight: '500' as const },
  bodySm: { fontSize: 14, fontWeight: '400' as const },
  bodySmMed: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  captionMed: { fontSize: 12, fontWeight: '600' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.4 },
  mono: { fontSize: 14, fontWeight: '500' as const, fontFamily: 'monospace' as const },
} as const;

export const shadow = {
  glow: {
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
