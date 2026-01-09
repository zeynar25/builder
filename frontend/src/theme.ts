export const theme = {
  colors: {
        highlight: '#FEAA00',
        support: '#FEF8E8',
        accent_1: '#3F3D56',
        accent_2: '#1E1E1E',
        mono: '#FDFDFB',

    text: {
        primary: '#2D3434',
        secondary: '#9B9B9B',
        inverse: '#FDFDFB',
        error: '#640000ff',
    },

  },

  spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 20,
        xl: 24,
        xxl: 48,
        max: 50
  },

  typography: {
    fontSize: {
        detail: 12,
        text: 16,
        title: 20,
        highlight: 48,
        stopwatch_active: 156,
        stopwatch_inactive: 64
    },
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        bold: '700' as const,

    }
  },

  icon: {
    form: 16,
    navbar: 24,
  },

  radii: {
    sm: 4,
    md: 8,
    pill: 999,
  },
};
