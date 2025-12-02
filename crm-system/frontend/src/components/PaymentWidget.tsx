import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, CircularProgress, List, ListItem, 
  ListItemText, TextField, Button, Divider, Paper 
} from '@mui/material';
import { getProjectPayments, addPayment} from '../api/client';
import type { Payment } from '../api/client';
interface Props {
  projectId: number;
  totalPrice: number; // סכום ללא מע"ם
  vatPercentage?: number; // אחוז מע"ם
  onPaymentAdded?: () => void; // callback לעדכון הפרויקט
}

export const PaymentWidget = ({ projectId, totalPrice, vatPercentage = 17, onPaymentAdded }: Props) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState('');

  // טעינת תשלומים
  const loadPayments = async () => {
    const data = await getProjectPayments(projectId);
    setPayments(data);
  };

  useEffect(() => {
    loadPayments();
  }, [projectId]);

  // חישובים מתמטיים
  const vatAmount = Math.round(totalPrice * (vatPercentage / 100) * 100) / 100;
  const totalWithVat = totalPrice + vatAmount;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const percent = totalWithVat > 0 ? Math.min((totalPaid / totalWithVat) * 100, 100) : 0;
  const remaining = totalWithVat - totalPaid;

  const handleAddPayment = async () => {
    if (!newAmount || Number(newAmount) <= 0) return;
    
    const amount = Number(newAmount);
    const maxAmount = totalWithVat - totalPaid;
    
    // בדיקה שלא משלמים יותר מהסכום המלא
    if (amount > maxAmount && maxAmount > 0) {
      alert(`לא ניתן לשלם יותר מהסכום הנותר: ₪${maxAmount.toLocaleString()}`);
      return;
    }
    
    try {
      await addPayment({
        projectId,
        amount: amount,
        note: newNote || 'תשלום',
        ...(newDate ? { date: newDate } : {})
      } as any);
      setNewAmount('');
      setNewNote('');
      setNewDate('');
      await loadPayments(); // רענון הנתונים
      onPaymentAdded?.(); // עדכון הפרויקט הראשי
    } catch (error) {
      console.error('שגיאה בהוספת תשלום:', error);
      alert('שגיאה בהוספת תשלום');
    }
  };

  const handlePayFull = () => {
    const remainingAmount = totalPrice - totalPaid;
    if (remainingAmount > 0) {
      setNewAmount(remainingAmount.toString());
      setNewNote('תשלום מלא');
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
      <Typography variant="h6" gutterBottom>ניהול תשלומים</Typography>
      
      {/* החלק הוויזואלי - המעגל */}
      <Box display="flex" alignItems="center" justifyContent="center" my={3} position="relative">
        <CircularProgress 
          variant="determinate" 
          value={percent} 
          size={120} 
          thickness={5} 
          sx={{ color: percent === 100 ? '#4caf50' : '#2196f3' }} 
        />
        <Box position="absolute" display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h5" fontWeight="bold">{Math.round(percent)}%</Typography>
          <Typography variant="caption" color="textSecondary">שולם</Typography>
        </Box>
      </Box>

      {/* פירוט מחירים */}
      <Box mb={2} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" mb={1}>פירוט מחירים:</Typography>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">ללא מע״מ:</Typography>
          <Typography variant="body2">₪{totalPrice.toLocaleString()}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">מע״מ ({vatPercentage}%):</Typography>
          <Typography variant="body2">₪{vatAmount.toLocaleString()}</Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body1" fontWeight="bold">סה״כ לתשלום:</Typography>
          <Typography variant="body1" fontWeight="bold">₪{totalWithVat.toLocaleString()}</Typography>
        </Box>
      </Box>
      
      {/* סיכום תשלומים */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography color="success.main">שולם: ₪{totalPaid.toLocaleString()}</Typography>
        <Typography color="error.main">נותר: ₪{remaining.toLocaleString()}</Typography>
      </Box>
    <Divider sx={{ my: 2 }} />
  
  
    {/* הוספת תשלום חדש */}
      <Typography variant="subtitle2" mb={1}>הוספת תשלום חדש</Typography>
      
      {/* שדה סכום גדול יותר */}
      <Box mb={2}>
        <TextField 
          label="סכום לתשלום (₪)" 
          type="number" 
          value={newAmount} 
          onChange={(e) => setNewAmount(e.target.value)}
          fullWidth
          InputProps={{
            inputProps: { 
              min: 0, 
              max: totalWithVat - totalPaid,
              style: { fontSize: '1.2rem', padding: '12px' }
            }
          }}
          helperText={`נותר לתשלום: ₪${(totalPrice - totalPaid).toLocaleString()}`}
        />
      </Box>
      
      <Box display="flex" gap={1} mb={2}>
        <TextField 
            label="תאריך"
            type="date" 
            size="small" 
            value={newDate} 
            onChange={(e) => setNewDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: '150px' }}
            />
        <TextField 
          label="הערה/סיבה" 
          size="small" 
          value={newNote} 
          onChange={(e) => setNewNote(e.target.value)}
          fullWidth
          placeholder="למשל: מעמ, עמלה, תשלום חלקי..."
        />
      </Box>
      
      <Box display="flex" gap={1} mb={2}>
        <Button 
          variant="contained" 
          onClick={handleAddPayment}
          disabled={!newAmount || Number(newAmount) <= 0}
          sx={{ minWidth: '100px' }}
        >
          הוסף תשלום
        </Button>
        <Button 
          variant="outlined" 
          onClick={handlePayFull}
          disabled={totalPaid >= totalPrice}
          sx={{ minWidth: '120px' }}
        >
          שלם את הכל (₪{(totalPrice - totalPaid).toLocaleString()})
        </Button>
      </Box>

      {/* רשימת תשלומים אחרונים */}
      <List dense sx={{ maxHeight: 150, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1 }}>
        {payments.map((p) => (
          <ListItem key={p.id} divider>
            <ListItemText 
              primary={`₪${Number(p.amount).toLocaleString()}`} 
              secondary={new Date(p.date).toLocaleDateString('he-IL')} 
            />
            <Typography variant="body2" color="textSecondary">{p.note}</Typography>
          </ListItem>
        ))}
        {payments.length === 0 && <Typography align="center" variant="body2" py={2}>אין תשלומים עדיין</Typography>}
      </List>
    </Paper>
  );
};