export const colors = {
  bg: '#0A0A0A',
  surface: '#111111',
  surfaceElevated: '#1A1A1A',
  surfaceHigh: '#222222',
  border: '#2A2A2A',
  borderSubtle: '#1E1E1E',

  yellow: '#F5C518',
  yellowDim: 'rgba(245,197,24,0.15)',
  yellowGlow: 'rgba(245,197,24,0.08)',

  accent: '#00D4FF',
  accentDim: 'rgba(0,212,255,0.15)',

  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textFaint: '#374151',

  success: '#22C55E',
  successDim: 'rgba(34,197,94,0.15)',
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
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const font = {
  display: { fontSize: 48, fontWeight: '800' as const, letterSpacing: -1.5 },
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8 },
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
