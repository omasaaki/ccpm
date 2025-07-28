import React from 'react';
import { Chip } from '@mui/material';
import { 
  CheckCircle, 
  RadioButtonChecked, 
  Schedule, 
  Cancel 
} from '@mui/icons-material';

interface StatusChipProps {
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'TODO':
        return {
          label: '未着手',
          color: 'default' as const,
          icon: <Schedule />,
        };
      case 'IN_PROGRESS':
        return {
          label: '進行中',
          color: 'primary' as const,
          icon: <RadioButtonChecked />,
        };
      case 'COMPLETED':
        return {
          label: '完了',
          color: 'success' as const,
          icon: <CheckCircle />,
        };
      case 'CANCELLED':
        return {
          label: 'キャンセル',
          color: 'error' as const,
          icon: <Cancel />,
        };
      default:
        return {
          label: status,
          color: 'default' as const,
          icon: undefined,
        };
    }
  };

  const config = getStatusConfig();

  const chipProps: any = {
    label: config.label,
    color: config.color,
    size: size,
  };
  
  if (config.icon) {
    chipProps.icon = config.icon;
  }
  
  return <Chip {...chipProps} />;
};

export default StatusChip;