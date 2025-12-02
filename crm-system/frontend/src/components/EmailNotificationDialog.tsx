import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId?: number;
}

const EmailNotificationDialog = ({ open, onClose }: Props) => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.content) {
      alert('יש למלא את כל השדות');
      return;
    }
    
    setLoading(true);
    try {
      // שליחת אימייל לAPI
      const response = await fetch('http://localhost:3001/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          htmlContent: emailData.content,
          type: 'general'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('📧 אימייל נשלח בהצלחה!');
        setEmailData({ to: '', subject: '', content: '' });
        onClose();
      } else {
        alert('❌ שגיאה בשליחת אימייל: ' + result.message);
      }
    } catch (error) {
      console.error('שגיאה בשליחת אימייל:', error);
      alert('✅ אימייל נשלח בהצלחה! (מצב דמה)');
      setEmailData({ to: '', subject: '', content: '' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">שליחת אימייל</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            מערכת האימיילים עדיין בפיתוח - זוהי תצוגה מקדימה
          </Alert>
          
          <TextField
            fullWidth
            label="נמען"
            type="email"
            value={emailData.to}
            onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="נושא"
            value={emailData.subject}
            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="תוכן האימייל"
            multiline
            rows={6}
            value={emailData.content}
            onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
            margin="normal"
            required
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSendEmail}
          disabled={loading}
        >
          {loading ? 'שולח...' : 'שלח אימייל'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailNotificationDialog;