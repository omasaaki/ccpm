import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Notification state
  notification: NotificationState;
  showNotification: (message: string, severity?: NotificationState['severity']) => void;
  hideNotification: () => void;
  
  // Theme state
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  // Sidebar state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const showNotification = (message: string, severity: NotificationState['severity'] = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const value: AppContextType = {
    isLoading,
    setIsLoading,
    notification,
    showNotification,
    hideNotification,
    isDarkMode,
    toggleTheme,
    isSidebarOpen,
    toggleSidebar,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};