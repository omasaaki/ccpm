import React from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useApp } from '../../store/AppContext';

const NotificationSnackbar: React.FC = () => {
  const { notification, hideNotification } = useApp();

  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={hideNotification}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={hideNotification}
        severity={notification.severity}
        sx={{ width: '100%' }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={hideNotification}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;