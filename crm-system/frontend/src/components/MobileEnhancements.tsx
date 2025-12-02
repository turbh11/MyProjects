import React from 'react';
import { useMediaQuery, useTheme, Box, SwipeableDrawer, Fab, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ProjectIcon from '@mui/icons-material/Assignment';
import ClientIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import VisitIcon from '@mui/icons-material/LocationOn';

interface MobileEnhancementsProps {
  children: React.ReactNode;
  onQuickAdd?: (type: 'project' | 'client' | 'payment' | 'visit') => void;
}

export const MobileEnhancements: React.FC<MobileEnhancementsProps> = ({ 
  children, 
  onQuickAdd 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [speedDialOpen, setSpeedDialOpen] = React.useState(false);

  const speedDialActions = [
    {
      icon: <ProjectIcon />,
      name: 'פרויקט חדש',
      onClick: () => onQuickAdd?.('project')
    },
    {
      icon: <ClientIcon />,
      name: 'לקוח חדש', 
      onClick: () => onQuickAdd?.('client')
    },
    {
      icon: <PaymentIcon />,
      name: 'תשלום',
      onClick: () => onQuickAdd?.('payment')
    },
    {
      icon: <VisitIcon />,
      name: 'ביקור',
      onClick: () => onQuickAdd?.('visit')
    }
  ];

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {children}
      
      {/* SpeedDial for quick actions on mobile */}
      <SpeedDial
        ariaLabel="פעולות מהירות"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          zIndex: 1000
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
        direction="up"
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipPlacement="left"
            onClick={() => {
              action.onClick();
              setSpeedDialOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-staticTooltip': {
                fontSize: '0.875rem',
                fontFamily: 'inherit'
              }
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};