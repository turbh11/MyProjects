import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Button,
  useMediaQuery,
  useTheme,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Divider
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Assignment as ProjectIcon,
  Engineering as TaskIcon,
  AccountBalance as BankIcon,
  MoreVert as MoreIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

interface MobileDashboardProps {
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalPotential: number;
    activeProjects: number;
    pendingTasks: number;
    currentMonthRevenue: number;
    taxInfo: { untaxedAmount: number; calculatedTax: number; taxPercentage: number };
  };
  onQuickAction?: (action: string) => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ 
  stats, 
  onQuickAction 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  if (!isMobile) {
    return null; // Use desktop version
  }

  // Show loading if no stats
  if (!stats || (stats.totalRevenue === 0 && stats.activeProjects === 0)) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        p={3}
      >
        <Typography variant="h6" color="textSecondary" gutterBottom>
          טוען נתונים...
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          אנא המתן בזמן שהמערכת טוענת את המידע
        </Typography>
      </Box>
    );
  }

  const statCards: StatCard[] = [
    {
      title: 'הכנסות חודש',
      value: `₪${stats.currentMonthRevenue.toLocaleString()}`,
      icon: <MoneyIcon />,
      color: '#4caf50',
      subtitle: 'חודש נוכחי'
    },
    {
      title: 'פרויקטים פעילים',
      value: stats.activeProjects,
      icon: <ProjectIcon />,
      color: '#2196f3',
      subtitle: 'בביצוע'
    },
    {
      title: 'משימות ממתינות',
      value: stats.pendingTasks,
      icon: <TaskIcon />,
      color: '#ff9800',
      subtitle: 'דורש טיפול'
    },
    {
      title: 'רווח נקי',
      value: `₪${stats.netProfit.toLocaleString()}`,
      icon: <BankIcon />,
      color: '#9c27b0',
      subtitle: 'סה"כ'
    }
  ];

  const quickActions = [
    { icon: <ProjectIcon />, name: 'פרויקט חדש', action: 'new-project' },
    { icon: <PersonIcon />, name: 'לקוח חדש', action: 'new-client' },
    { icon: <PaymentIcon />, name: 'תשלום', action: 'new-payment' },
    { icon: <EventIcon />, name: 'ביקור', action: 'new-visit' },
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ position: 'relative', pb: 10 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={2}>
        <Typography variant="h5" fontWeight={600} color="primary.main">
          לוח בקרה
        </Typography>
        <IconButton onClick={handleMenuClick} size="small">
          <MoreIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MenuItem onClick={() => { onQuickAction?.('export'); handleMenuClose(); }}>
            ייצא נתונים
          </MenuItem>
          <MenuItem onClick={() => { onQuickAction?.('settings'); handleMenuClose(); }}>
            הגדרות מס
          </MenuItem>
          <MenuItem onClick={() => { onQuickAction?.('reports'); handleMenuClose(); }}>
            דוחות
          </MenuItem>
        </Menu>
      </Box>

      {/* Stats Cards Grid */}
      <Grid container spacing={2} px={2}>
        {statCards.map((card, index) => (
          <Grid item xs={6} key={index}>
            <Card
              sx={{
                minHeight: 120,
                background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}25 100%)`,
                border: `1px solid ${card.color}30`,
                borderRadius: 3,
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Icon */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                >
                  {card.icon}
                </Box>
                
                {/* Content */}
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {card.title}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color={card.color} mt={0.5}>
                    {card.value}
                  </Typography>
                  {card.subtitle && (
                    <Typography variant="caption" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tax Info Card */}
      <Card sx={{ mx: 2, mt: 2, borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                מס לתשלום
              </Typography>
              <Typography variant="h6" color="error.main" fontWeight={600}>
                ₪{stats.taxInfo.calculatedTax.toLocaleString()}
              </Typography>
            </Box>
            <Chip 
              label={`${stats.taxInfo.taxPercentage}% מס`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            הכנסה לא חויבת: ₪{stats.taxInfo.untaxedAmount.toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Box sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1000 }}>
        <Stack direction="row" spacing={1} justifyContent="center">
          {quickActions.slice(0, 3).map((action, index) => (
            <Button
              key={index}
              variant="contained"
              size="small"
              startIcon={action.icon}
              onClick={() => onQuickAction?.(action.action)}
              sx={{
                minWidth: 100,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.75rem'
              }}
            >
              {action.name.split(' ')[0]}
            </Button>
          ))}
          
          {/* Speed Dial for more actions */}
          <SpeedDial
            ariaLabel="עוד פעולות"
            sx={{ 
              '& .MuiFab-root': { 
                width: 48, 
                height: 48,
                minHeight: 48
              }
            }}
            icon={<SpeedDialIcon />}
            onClose={() => setSpeedDialOpen(false)}
            onOpen={() => setSpeedDialOpen(true)}
            open={speedDialOpen}
            direction="up"
          >
            {quickActions.slice(3).map((action) => (
              <SpeedDialAction
                key={action.action}
                icon={action.icon}
                tooltipTitle={action.name}
                tooltipPlacement="left"
                onClick={() => {
                  onQuickAction?.(action.action);
                  setSpeedDialOpen(false);
                }}
              />
            ))}
          </SpeedDial>
        </Stack>
      </Box>
    </Box>
  );
};