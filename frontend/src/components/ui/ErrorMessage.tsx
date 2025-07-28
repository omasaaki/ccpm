import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  severity?: 'error' | 'warning';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title = 'エラーが発生しました',
  message,
  onRetry,
  severity = 'error'
}) => {
  return (
    <Box my={2}>
      <Alert 
        severity={severity}
        action={
          onRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={onRetry}
              startIcon={<Refresh />}
            >
              再試行
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;