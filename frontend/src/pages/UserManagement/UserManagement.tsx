import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useAuth } from '../../store/AuthContext';
import Users from './Users';
import Organizations from './Organizations';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-management-tab-${index}`,
    'aria-controls': `user-management-tabpanel-${index}`,
  };
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Only admins can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <h2>アクセス権限がありません</h2>
          <p>このページは管理者のみアクセスできます。</p>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="user management tabs">
          <Tab label="ユーザー管理" {...a11yProps(0)} />
          <Tab label="組織管理" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Users />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Organizations />
      </TabPanel>
    </Box>
  );
};

export default UserManagement;