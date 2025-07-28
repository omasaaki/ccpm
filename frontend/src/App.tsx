import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider, useApp } from './store/AppContext';
import MainLayout from './components/Layout/MainLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import NotificationSnackbar from './components/ui/NotificationSnackbar';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Projects from './pages/Projects/Projects';
import Tasks from './pages/Tasks/Tasks';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// App content with theme
const AppContent: React.FC = () => {
  const { isDarkMode } = useApp();
  
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
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
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
          ].join(','),
        },
      }),
    [isDarkMode]
  );
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Navigate to="/dashboard" replace />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Projects />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Tasks />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      <NotificationSnackbar />
    </ThemeProvider>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;