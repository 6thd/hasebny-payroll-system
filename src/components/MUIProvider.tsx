'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from '@/lib/mui-theme';
import MUISnackbarProvider from './dashboard/MUISnackbarProvider';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

export default function MUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MUISnackbarProvider>
          {children}
        </MUISnackbarProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}