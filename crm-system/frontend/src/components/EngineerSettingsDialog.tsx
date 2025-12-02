import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import { getEngineerInfo, updateEngineerInfo } from '../api/client';
import type { EngineerInfo } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const EngineerSettingsDialog = ({ open, onClose }: Props) => {
  const [engineerInfo, setEngineerInfo] = useState<EngineerInfo>({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadEngineerInfo();
    }
  }, [open]);

  const loadEngineerInfo = async () => {
    try {
      setLoading(true);
      const info = await getEngineerInfo();
      setEngineerInfo(info);
    } catch (error) {
      console.error('שגיאה בטעינת פרטי המהנדס:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!engineerInfo.name.trim() || !engineerInfo.email.trim() || !engineerInfo.phone.trim()) {
      alert('יש למלא את כל השדות');
      return;
    }

    try {
      setLoading(true);
      const result = await updateEngineerInfo(engineerInfo);
      console.log('עדכון הושלם:', result);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // רענון הדף כדי שהמשתמש יראה את השינויים
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('שגיאה בעדכון פרטי המהנדס:', error);
      alert('שגיאה בעדכון הפרטים');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EngineerInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEngineerInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">הגדרות אישיות</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            הפרטים עודכנו בהצלחה! הצעות המחיר החדשות יכללו את הפרטים החדשים.
          </Alert>
        )}

        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          פרטים אלה יופיעו בהצעות המחיר ובהודעות הווטסאפ
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="שם מלא"
            value={engineerInfo.name}
            onChange={handleInputChange('name')}
            fullWidth
            disabled={loading}
            placeholder="מוטי מנחם"
            helperText="שם זה יופיע בהצעות המחיר"
          />

          <TextField
            label="כתובת אימייל"
            type="email"
            value={engineerInfo.email}
            onChange={handleInputChange('email')}
            fullWidth
            disabled={loading}
            placeholder="Eng.motimen@gmail.com"
            helperText="כתובת האימייל המקצועית שלך"
          />

          <TextField
            label="מספר טלפון"
            value={engineerInfo.phone}
            onChange={handleInputChange('phone')}
            fullWidth
            disabled={loading}
            placeholder="052-2670274"
            helperText="המספר הראשי ליצירת קשר"
          />
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            💡 <strong>טיפ:</strong> לאחר עדכון הפרטים, הצעות המחיר החדשות יכללו אוטומטית את הפרטים המעודכנים.
            הצעות קיימות לא ישתנו.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          ביטול
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'שומר...' : 'שמור פרטים'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};