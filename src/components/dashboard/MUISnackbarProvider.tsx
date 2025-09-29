'use client';

import { SnackbarProvider } from 'notistack';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function MUISnackbarProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      action={(key) => (
        <Button 
          onClick={() => {
            // @ts-ignore
            window.notistackRef.closeSnackbar(key);
          }}
          size="small"
          sx={{ color: 'white' }}
        >
          إغلاق
        </Button>
      )}
      Components={{
        success: (props) => (
          <div 
            {...props} 
            style={{
              backgroundColor: theme.palette.success.main,
              color: 'white',
              borderRadius: theme.shape.borderRadius,
              padding: '8px 16px',
              minWidth: '300px',
            }}
          />
        ),
        error: (props) => (
          <div 
            {...props} 
            style={{
              backgroundColor: theme.palette.error.main,
              color: 'white',
              borderRadius: theme.shape.borderRadius,
              padding: '8px 16px',
              minWidth: '300px',
            }}
          />
        ),
        warning: (props) => (
          <div 
            {...props} 
            style={{
              backgroundColor: theme.palette.warning.main,
              color: 'white',
              borderRadius: theme.shape.borderRadius,
              padding: '8px 16px',
              minWidth: '300px',
            }}
          />
        ),
        info: (props) => (
          <div 
            {...props} 
            style={{
              backgroundColor: theme.palette.info.main,
              color: 'white',
              borderRadius: theme.shape.borderRadius,
              padding: '8px 16px',
              minWidth: '300px',
            }}
          />
        ),
      }}
    >
      {children}
    </SnackbarProvider>
  );
}