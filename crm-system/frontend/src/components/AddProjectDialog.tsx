import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, MenuItem 
} from '@mui/material';
import { createProject } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  onProjectAdded: () => void;
}

export const AddProjectDialog = ({ open, onClose, onProjectAdded }: Props) => {
  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    location: '',      // עיר
    street: '',        // רחוב (חדש)
    buildingNumber: '',// מספר (חדש)
    district: '',
    phoneNumber: '',
    email: '',
    totalPrice: 0,
    vatPercentage: 17,
    status: 'Pre-Work'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      // --- הלוגיקה החדשה ---
      // אם הוזן מחיר גדול מ-0, הסטטוס משתנה אוטומטית ל"נשלחה הצעת מחיר"
      const finalStatus = Number(formData.totalPrice) > 0 ? 'Proposal Sent' : 'Pre-Work';
      
      await createProject({
        ...formData,
        status: finalStatus as any // כופים את הסטטוס החדש
      } as any);
      
      onProjectAdded();
      onClose();
      // איפוס
      setFormData({ 
        clientName: '', description: '', location: '', street: '', buildingNumber: '',
        district: '', phoneNumber: '', email: '', totalPrice: 0, vatPercentage: 17, status: 'Pre-Work' 
      });
    } catch (error) {
      alert('שגיאה ביצירת פרויקט.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} dir="rtl" maxWidth="sm" fullWidth>
      <DialogTitle>הוספת עבודה חדשה</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="שם הלקוח" name="clientName" onChange={handleChange} />
          </Grid>
          
          <Grid item xs={6}>
             <TextField fullWidth label="טלפון" name="phoneNumber" onChange={handleChange} />
           </Grid>
           <Grid item xs={12} sm={6}>
             <TextField fullWidth label="אימייל" name="email" type="email" onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField 
              fullWidth 
              type="number" 
              label="סכום ללא מעמ (₪)" 
              name="totalPrice" 
              value={formData.totalPrice}
              onChange={handleChange} 
              helperText={Number(formData.totalPrice) > 0 ? `מעמ (${Number(formData.vatPercentage)}%): ₪${(Number(formData.totalPrice) * (Number(formData.vatPercentage) / 100)).toLocaleString()} | סה"כ עם מעמ: ₪${(Number(formData.totalPrice) * (1 + Number(formData.vatPercentage) / 100)).toLocaleString()}` : ''}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField 
              fullWidth 
              type="number" 
              label="אחוז מעמ (%)" 
              name="vatPercentage" 
              value={formData.vatPercentage}
              onChange={handleChange} 
              inputProps={{ min: 0, max: 50, step: 0.1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="תיאור העבודה" name="description" multiline rows={2} onChange={handleChange} />
          </Grid>

          {/* שורה 1 של כתובת: עיר ומחוז */}
          <Grid item xs={8}>
            <TextField fullWidth label="עיר / יישוב" name="location" onChange={handleChange} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth select label="מחוז" name="district" value={formData.district} onChange={handleChange}>
              <MenuItem value="גוש עציון">גוש עציון</MenuItem>
              <MenuItem value="בנימין">בנימין</MenuItem>
              <MenuItem value="ירושלים">ירושלים</MenuItem>
              <MenuItem value="מרכז">מרכז</MenuItem>
              <MenuItem value="דרום">דרום</MenuItem>
              <MenuItem value="צפון">צפון</MenuItem>
              <MenuItem value="יהודה">יהודה</MenuItem>
              <MenuItem value="שומרון">שומרון</MenuItem>
            </TextField>
          </Grid>

          {/* שורה 2 של כתובת: רחוב ומספר */}
          <Grid item xs={8}>
            <TextField fullWidth label="רחוב" name="street" onChange={handleChange} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="מס' בית" name="buildingNumber" onChange={handleChange} />
          </Grid>

        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          שמור עבודה
        </Button>
      </DialogActions>
    </Dialog>
  );
};