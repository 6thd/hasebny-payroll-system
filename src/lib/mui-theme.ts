import { createTheme } from '@mui/material/styles';

// Extract colors from your existing Tailwind configuration
const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#8B5CF6', // Your existing primary color (262 82% 56%)
    },
    secondary: {
      main: '#E5E7EB', // Your existing secondary color (240 5% 90%)
    },
    background: {
      default: '#F3F4F6', // Your existing background color (240 10% 97%)
      paper: '#FFFFFF',   // Your existing card color
    },
    text: {
      primary: '#111827', // Your existing foreground color (240 6% 10%)
    },
    error: {
      main: '#EF4444', // Your existing destructive color
    },
  },
  typography: {
    fontFamily: [
      'Cairo',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem', // Match your existing border radius
          textTransform: 'none',   // Don't uppercase text
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
        },
      },
    },
  },
});

export default theme;