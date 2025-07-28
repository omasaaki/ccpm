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
import { RegisterForm } from '../../types/auth';
import { validateForm } from '../../utils/validation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showNotification } = useApp();
  
  const [form, setForm] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
      username: { required: true, minLength: 3, maxLength: 50 },
      email: { required: true, email: true },
      password: { required: true, minLength: 8 },
      confirmPassword: { required: true },
    });
    
    // Check password confirmation
    if (form.password !== form.confirmPassword) {
      validationErrors.confirmPassword = 'パスワードが一致しません';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    setApiError('');
    
    try {
      await register(form);
      showNotification('ユーザー登録に成功しました', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      setApiError(error.message || 'ユーザー登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner message="登録中..." fullScreen />;
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
            ユーザー登録
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
              id="username"
              label="ユーザー名"
              name="username"
              autoComplete="username"
              autoFocus
              value={form.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="メールアドレス"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || '8文字以上で入力してください'}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="パスワード（確認）"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              登録
            </Button>
            
            <Box textAlign="center">
              <Link component={RouterLink} to="/login" variant="body2">
                すでにアカウントをお持ちの方はこちら
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;