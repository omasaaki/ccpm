import { createTheme } from '@mui/material/styles';
import { jaJP } from '@mui/material/locale';

// CCPM Brand Colors
const brandColors = {
  primary: {
    main: '#2563eb', // Blue
    light: '#3b82f6',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#7c3aed', // Purple
    light: '#8b5cf6',
    dark: '#6d28d9',
    contrastText: '#ffffff',
  },
  success: {
    main: '#059669', // Green
    light: '#10b981',
    dark: '#047857',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#d97706', // Orange
    light: '#f59e0b',
    dark: '#b45309',
    contrastText: '#ffffff',
  },
  error: {
    main: '#dc2626', // Red
    light: '#ef4444',
    dark: '#b91c1c',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0891b2', // Cyan
    light: '#06b6d4',
    dark: '#0e7490',
    contrastText: '#ffffff',
  },
};

// Create theme
export const theme = createTheme({
  palette: {
    mode: 'light',
    ...brandColors,
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Noto Sans JP"',
      '"Hiragino Kaku Gothic ProN"',
      '"Hiragino Sans"',
      'Meiryo',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.primary.main,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
  },
}, jaJP);

// Dark theme
export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    ...brandColors,
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    grey: {
      50: '#1e293b',
      100: '#334155',
      200: '#475569',
      300: '#64748b',
      400: '#94a3b8',
      500: '#cbd5e1',
      600: '#e2e8f0',
      700: '#f1f5f9',
      800: '#f8fafc',
      900: '#ffffff',
    },
  },
}, jaJP);

export default theme;