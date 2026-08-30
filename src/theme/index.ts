// Daily Delight Design System
export const Colors = {
  // Brand
  primary: '#0C831F', // Deep grocery green
  primaryDark: '#085F16',
  primaryLight: '#E6F5EA',
  accent: '#FF6B35', // Vibrant orange for CTAs
  accentDark: '#E55526',
  accentLight: '#FFE8E0',
  secondary: '#FFD93D', // Sunny yellow for offers

  // Neutrals
  white: '#FFFFFF',
  black: '#0F1419',
  gray900: '#1A1F26',
  gray800: '#2D343F',
  gray700: '#4A5360',
  gray600: '#6B7380',
  gray500: '#8B929E',
  gray400: '#B4B9C2',
  gray300: '#D5D9E0',
  gray200: '#E8EBF0',
  gray100: '#F4F6F9',
  gray50: '#FAFBFC',

  // Semantic
  success: '#0C831F',
  warning: '#FF9500',
  error: '#E53935',
  info: '#2196F3',

  // Surfaces
  bg: '#FAFBFC',
  bgAlt: '#F4F6F9',
  card: '#FFFFFF',
  border: '#E8EBF0',
  borderStrong: '#D5D9E0',
  text: '#0F1419',
  textSecondary: '#6B7380',
  textMuted: '#8B929E',
  overlay: 'rgba(15,20,25,0.55)',

  // Status badges
  statusPlaced: '#FF9500',
  statusConfirmed: '#2196F3',
  statusPacked: '#9C27B0',
  statusShipped: '#FF6B35',
  statusDelivered: '#0C831F',
  statusCancelled: '#E53935',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const Typography = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  h4: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyBold: { fontSize: 14, fontWeight: '600' as const },
  small: { fontSize: 12, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
};

export const Shadow = {
  sm: {
    shadowColor: '#0F1419',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F1419',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F1419',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Brand = {
  name: 'Daily Delight',
  tagline: 'Groceries in minutes',
  ownerName: 'Daily Delight Owner',
};
