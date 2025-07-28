import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Alert } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface ApiStatus {
  message: string;
  version: string;
  timestamp: string;
}

function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkApiStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/v1/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApiStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom align="center">
            🎯 CCPM
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
            Critical Chain Project Management
          </Typography>

          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h4" gutterBottom>
              開発環境構築完了！
            </Typography>
            
            <Typography variant="body1" paragraph>
              CCPM（Critical Chain Project Management）システムの開発環境が正常に起動しています。
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                🔗 アクセス可能なエンドポイント:
              </Typography>
              <ul>
                <li><strong>Frontend</strong>: http://localhost:3000</li>
                <li><strong>Backend API</strong>: http://localhost:3001</li>
                <li><strong>Health Check</strong>: http://localhost:3001/health</li>
                <li><strong>Adminer (DB)</strong>: http://localhost:8080</li>
                <li><strong>Redis Commander</strong>: http://localhost:8081</li>
              </ul>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={checkApiStatus}
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {loading ? 'チェック中...' : 'API接続テスト'}
              </Button>
            </Box>

            {apiStatus && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">API接続成功!</Typography>
                <Typography variant="body2">
                  {apiStatus.message} (v{apiStatus.version})
                </Typography>
                <Typography variant="caption">
                  最終確認: {new Date(apiStatus.timestamp).toLocaleString()}
                </Typography>
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">API接続エラー</Typography>
                <Typography variant="body2">{error}</Typography>
                <Typography variant="caption">
                  バックエンドサーバーが起動していることを確認してください
                </Typography>
              </Alert>
            )}
          </Paper>

          <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 次のステップ:
            </Typography>
            <ol>
              <li>データベースセットアップ (Prisma)</li>
              <li>基本フレームワーク実装</li>
              <li>認証・認可基盤実装</li>
              <li>コア機能開発</li>
            </ol>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;