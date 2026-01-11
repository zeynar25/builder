export const theme = {
  colors: {
        highlight: '#FEAA00',
        support: '#FEF8E8',
        accent_1: '#3F3D56',
        accent_2: '#1E1E1E',
        accent_3: '#89A0BC',
        accent_4: '#efa5b4',
        mono: '#FDFDFB',

    text: {
        primary: '#2D3434',
        secondary: '#9B9B9B',
        inverse: '#FDFDFB',
        error: 'rgb(219, 39, 39)',
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
        onboard: 32,
    },
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        bold: '700' as const,
    },
    fontFamily: {
        primary: 'Rubik',
    },
  },

  icon: {
    form: 16,
    navbar: 48,
  },

  radii: {
    sm: 4,
    md: 8,
    pill: 999,
  },
};
