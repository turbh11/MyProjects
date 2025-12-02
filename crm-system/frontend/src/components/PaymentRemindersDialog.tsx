import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PaymentIcon from '@mui/icons-material/Payment';
import { apiClient } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface PaymentReminder {
  clientName: string;
  phoneNumber: string;
  totalDebt: number;
  overdueDays: number;
  whatsappUrl: string;
  projectsCount: number;
}

export const PaymentRemindersDialog = ({ open, onClose }: Props) => {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open && !sent) {
      generateReminders();
    }
  }, [open, sent]);

  const generateReminders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/messaging/payment-reminders');
      setReminders(response.data.results || []);
      setSent(true);
    } catch (error) {
      console.error('שגיאה ביצירת תזכורות תשלום:', error);
      alert('שגיאה ביצירת תזכורות התשלום');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (url: string) => {
    window.open(url, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const getUrgencyColor = (overdueDays: number) => {
    if (overdueDays > 60) return 'error';
    if (overdueDays > 30) return 'warning';
    return 'info';
  };

  const handleClose = () => {
    setSent(false);
    setReminders([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <PaymentIcon sx={{ mr: 1, color: '#f57c00' }} />
          <Typography variant="h6">תזכורות תשלום</Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 200 }}>
            <Typography>מכין תזכורות תשלום...</Typography>
          </Box>
        ) : reminders.length === 0 ? (
          <Alert severity="success">
            אין לקוחות עם חובות פתוחים! כל התשלומים עדכניים 👏
          </Alert>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              נמצאו {reminders.length} לקוחות עם חובות פתוחים
            </Alert>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              לחץ על הכפתורים כדי לשלוח תזכורת תשלום בווטסאפ
            </Typography>

            <List>
              {reminders.map((reminder, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {reminder.clientName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          📞 {reminder.phoneNumber}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            חוב כולל: <strong>{formatCurrency(reminder.totalDebt)}</strong>
                          </Typography>
                          <Chip
                            label={`${reminder.overdueDays} ימים באיחור`}
                            size="small"
                            color={getUrgencyColor(reminder.overdueDays)}
                          />
                        </Box>
                        {reminder.projectsCount > 1 && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {reminder.projectsCount} פרויקטים פתוחים
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<WhatsAppIcon />}
                        onClick={() => openWhatsApp(reminder.whatsappUrl)}
                        sx={{ ml: 2 }}
                      >
                        שלח תזכורת
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          סגור
        </Button>
        {!loading && reminders.length > 0 && (
          <Button
            variant="outlined"
            onClick={() => {
              reminders.forEach(reminder => {
                setTimeout(() => openWhatsApp(reminder.whatsappUrl), 500);
              });
            }}
          >
            פתח את כל התזכורות
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};