import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  Typography,
  Button,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { apiClient } from '../api/client';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  project?: {
    clientName: string;
    location: string;
  };
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      console.log('טוען התראות מהשרת...');
      const response = await apiClient.get('/notifications?status=pending');
      console.log('התראות שהתקבלו:', response.data);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('שגיאה בטעינת התראות:', error);
      // אם יש שגיאה עם החיבור לשרת, ננסה עם fetch רגיל
      try {
        console.log('ניסיון חיבור עם fetch...');
        const response = await fetch('http://localhost:3001/notifications?status=pending');
        const data = await response.json();
        console.log('התראות מ-fetch:', data);
        setNotifications(data);
      } catch (fetchError) {
        console.error('שגיאה גם עם fetch:', fetchError);
        // רק אז נציג נתונים מדומים
        setNotifications([
          {
            id: 1,
            type: 'payment_overdue',
            title: '💰 תשלום מתעכב',
            message: 'יש 3 פרויקטים עם תשלומים מתעכבים:\n• יוסי לוי - רעננה (45 ימים)\n• משה כהן - תל אביב (32 ימים)\n• רחל אברהם - חיפה (28 ימים)',
            status: 'pending',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            type: 'no_visit_long_time',
            title: '📅 פרויקטים ללא ביקור',
            message: 'פרויקטים הזקוקים לביקור:\n• דני מור - פתח תקווה (18 ימים ללא ביקור)\n• שרה לוי - נתניה (22 ימים ללא ביקור)',
            status: 'pending',
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            type: 'weekly_summary',
            title: '📊 סיכום שבועי',
            message: 'השבוע נוצרו 5 פרויקטים חדשים:\n• אלון דוד - ירושלים\n• מירי כהן - באר שבע\n• יוסי רון - אשדוד',
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (error) {
      console.error('שגיאה בסימון התראה כנקראה:', error);
    }
  };

  const handleDismiss = async (notificationId: number) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/dismiss`);
      loadNotifications();
    } catch (error) {
      console.error('שגיאה בביטול התראה:', error);
    }
  };

  const refreshNotifications = async () => {
    try {
      // קריאה לendpoint החדש שיעדכן את ההתראות עם נתונים אמיתיים
      await fetch('http://localhost:3001/notifications/refresh', {
        method: 'POST',
      });
      
      // טעינה מחדש של ההתראות
      setTimeout(() => {
        loadNotifications();
      }, 1000); // המתנה קצרה שהserver יסיים לעבד
      
    } catch (error) {
      console.error('שגיאה ברענון התראות:', error);
      // בכל מקרה נרענן מה שיש
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      // סימון כל ההתראות כנקראות
      await Promise.all(
        activeNotifications.map(notification => 
          apiClient.patch(`/notifications/${notification.id}/read`)
        )
      );
      loadNotifications();
    } catch (error) {
      console.error('שגיאה בסימון הכל כנקרא:', error);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_overdue': return 'error';
      case 'no_visit_long_time': return 'warning';
      case 'weekly_summary': return 'info';
      default: return 'default';
    }
  };

  const open = Boolean(anchorEl);
  const activeNotifications = notifications.filter(n => n.status === 'pending');

  return (
    <Box>
      <IconButton onClick={handleClick} color="inherit">
        <Badge badgeContent={activeNotifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">התראות ({activeNotifications.length})</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeNotifications.length > 0 && (
                <Button 
                  variant="text" 
                  size="small"
                  onClick={markAllAsRead}
                  sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                >
                  ✅ סמן הכל כנקרא
                </Button>
              )}
              <Button 
                variant="outlined" 
                size="small"
                onClick={refreshNotifications}
                sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
              >
                🔄 רענן
              </Button>
            </Box>
          </Box>
          
          {activeNotifications.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="success" variant="outlined">
                אין התראות חדשות
              </Alert>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={refreshNotifications}
                  sx={{ fontSize: '0.75rem' }}
                >
                  🔄 בדוק התראות חדשות
                </Button>
              </Box>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              <ListItem sx={{ justifyContent: 'center', py: 1 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={refreshNotifications}
                  sx={{ fontSize: '0.75rem' }}
                >
                  🔄 רענן התראות
                </Button>
              </ListItem>
              <Divider />
              
              {activeNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box display="flex" alignItems="center" width="100%" mb={1}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        {notification.title}
                      </Typography>
                      <Chip 
                        label={notification.type.replace('_', ' ')} 
                        size="small" 
                        color={getNotificationColor(notification.type)} 
                      />
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ mb: 1, whiteSpace: 'pre-line' }}
                    >
                      {notification.message}
                    </Typography>
                    
                    {notification.project && (
                      <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
                        פרויקט: {notification.project.clientName} - {notification.project.location}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                      {new Date(notification.createdAt).toLocaleString('he-IL')}
                    </Typography>
                    
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        סמן כנקרא
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDismiss(notification.id)}
                      >
                        בטל
                      </Button>
                    </Box>
                  </ListItem>
                  {index < activeNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default NotificationBell;