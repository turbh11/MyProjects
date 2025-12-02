import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { apiClient } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const VatSettingsDialog = ({ open, onClose, onUpdated }: Props) => {
  const [newVatPercentage, setNewVatPercentage] = useState<number>(17);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleUpdateVat = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      // עדכון אחוז מע"ם לכל הפרויקטים
      const response = await fetch('/api/projects/update-vat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vatPercentage: newVatPercentage
        })
      });
      
      const data = await response.json();
      
      setMessage(`עודכן אחוז מע"ם ל-${newVatPercentage}% עבור ${data.updated} פרויקטים`);
      
      if (onUpdated) {
        onUpdated();
      }
      
      // סגירה אוטומטית אחרי 2 שניות
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('שגיאה בעדכון מע"מ:', error);
      setMessage('שגיאה בעדכון אחוז המע"מ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} dir="rtl" maxWidth="sm" fullWidth>
      <DialogTitle>עדכון אחוז מע"מ</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            עדכון אחוז המע"מ יחול על כל הפרויקטים הקיימים במערכת.
            הפעולה תעדכן גם את ברירת המחדל לפרויקטים חדשים.
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            label="אחוז מע״מ חדש (%)"
            value={newVatPercentage}
            onChange={(e) => setNewVatPercentage(Number(e.target.value))}
            inputProps={{ min: 0, max: 50, step: 0.1 }}
            helperText="למשל: 17 או 18"
          />
          
          {message && (
            <Alert 
              severity={message.includes('שגיאה') ? 'error' : 'success'} 
              sx={{ mt: 2 }}
            >
              {message}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          ביטול
        </Button>
        <Button 
          onClick={handleUpdateVat} 
          variant="contained" 
          disabled={isLoading || newVatPercentage < 0 || newVatPercentage > 50}
        >
          {isLoading ? 'מעדכן...' : 'עדכן מע"מ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};