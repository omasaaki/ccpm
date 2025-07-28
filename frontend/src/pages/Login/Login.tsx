import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
} from '@mui/material';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { LoginForm } from '../../types/auth';
import { validateForm } from '../../utils/validation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useApp();
  
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(form, {
      email: { required: true, email: true },
      password: { required: true },
    });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    setApiError('');
    
    try {
      await login(form);
      showNotification('ログインに成功しました', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      setApiError(error.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner message="ログイン中..." fullScreen />;
  }
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            ログイン
          </Typography>
          
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
              autoFocus
              value={form.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="パスワード"
              type="password"
              id="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              ログイン
            </Button>
            
            <Box textAlign="center">
              <Link component={RouterLink} to="/register" variant="body2">
                アカウントをお持ちでない方はこちら
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;