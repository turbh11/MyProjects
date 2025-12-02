import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Alert, FormControlLabel, Switch, Divider, Typography, Box 
} from '@mui/material';
import { getProposalTemplate, updateProposalTemplate, getSetting, saveSetting } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  onToggleSeedBtn: (show: boolean) => void; 
  currentSeedState: boolean;
}

export const SettingsDialog = ({ open, onClose, onToggleSeedBtn, currentSeedState }: Props) => {
  const [template, setTemplate] = useState('');
  const [showSeed, setShowSeed] = useState(currentSeedState);
  const [syncTime, setSyncTime] = useState('00:00'); // ברירת מחדל

  useEffect(() => {
    if (open) {
        // טעינת תבנית
        getProposalTemplate().then(data => setTemplate(data.value));
        
        // טעינת שעת סנכרון
        getSetting('sync_time').then(data => {
            if (data && data.value) setSyncTime(data.value);
        });

        setShowSeed(currentSeedState); 
    }
  }, [open, currentSeedState]);

  const handleSave = async () => {
    // שמירת הכל במקביל
    await Promise.all([
        updateProposalTemplate(template),
        saveSetting('sync_time', syncTime)
    ]);
    
    onToggleSeedBtn(showSeed); 
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle>הגדרות מערכת</DialogTitle>
      <DialogContent>
        
        {/* הגדרות כלליות */}
        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">כללי</Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography>שעת סנכרון אוטומטי למחשב:</Typography>
            <TextField 
                type="time" 
                value={syncTime} 
                onChange={(e) => setSyncTime(e.target.value)}
                size="small"
            />
        </Box>

        <FormControlLabel
          control={<Switch checked={showSeed} onChange={(e) => setShowSeed(e.target.checked)} />}
          label="הצג כפתור יצירת נתוני דמה (Seed)"
        />
        
        <Divider sx={{ my: 3 }} />

        {/* הגדרות תבנית */}
        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">תבנית הצעת מחיר (Word)</Typography>
        <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>משתנים זמינים לשימוש בתבנית:</Typography>
          <Box component="ul" sx={{ margin: 0, paddingRight: 2 }}>
            <li><code>{'{{clientName}}'}</code> - שם הלקוח</li>
            <li><code>{'{{description}}'}</code> - תיאור העבודה</li>
            <li><code>{'{{address}}'}</code> - כתובת מלאה</li>
            <li><code>{'{{totalPrice}}'}</code> - מחיר כולל מע"מ</li>
            <li><code>{'{{priceBeforeVat}}'}</code> - מחיר לפני מע"מ</li>
            <li><code>{'{{vatAmount}}'}</code> - סכום המע"מ</li>
            <li><code>{'{{totalPaid}}'}</code> - סכום ששולם</li>
            <li><code>{'{{remaining}}'}</code> - יתרה לתשלום</li>
            <li><code>{'{{phone}}'}</code> - מספר טלפון</li>
            <li><code>{'{{date}}'}</code> - תאריך הנוכחי</li>
            <li><code>{'{{projectId}}'}</code> - מספר הצעה</li>
          </Box>
        </Alert>
        <TextField
          multiline
          rows={8}
          fullWidth
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          sx={{ fontFamily: 'monospace', direction: 'rtl' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={handleSave} variant="contained">שמור הגדרות</Button>
      </DialogActions>
    </Dialog>
  );
};