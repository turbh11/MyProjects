import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Grid,
  Paper,
  TextField
} from '@mui/material';
import { Project, Payment } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  payments: Payment[];
}

export const ReceiptDialog = ({ open, onClose, project, payments }: Props) => {
  const [companyDetails, setCompanyDetails] = useState({
    name: 'שם החברה',
    address: 'כתובת החברה',
    phone: 'טלפון החברה',
    email: 'email@company.com',
    businessNumber: '123456789'
  });

  if (!project) return null;

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const vatPercentage = Number(project.vatPercentage || 17);
  const totalPrice = Number(project.totalPrice || 0);
  const vatAmount = Math.round(totalPrice * (vatPercentage / 100) * 100) / 100;
  const totalWithVat = totalPrice + vatAmount;

  const sendReceiptByEmail = async () => {
    if (!project || !project.phoneNumber) {
      alert('לא נמצא כתובת מייל');
      return;
    }
    
    try {
      const response = await fetch('/api/email/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          clientEmail: project.phoneNumber, // נשתמש בשדה הטלפון כמייל לעת
          clientName: project.clientName,
          receiptContent: 'קבלה מעוצבת'
        })
      });
      
      if (response.ok) {
        alert('הקבלה נשלחה במייל!');
      } else {
        alert('שגיאה בשליחת המייל');
      }
    } catch (error) {
      alert('שגיאה בשליחת המייל');
    }
  };

  const generateReceipt = () => {
    const receiptContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>קבלה - ${project.clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2196f3; }
          .receipt-title { font-size: 20px; margin: 20px 0; }
          .details-section { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; }
          .total-row { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          .payments-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .payments-table th, .payments-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          .payments-table th { background-color: #f5f5f5; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyDetails.name}</div>
          <div>כתובת: ${companyDetails.address}</div>
          <div>טלפון: ${companyDetails.phone} | אימייל: ${companyDetails.email}</div>
          <div>ח.פ/ע.מ: ${companyDetails.businessNumber}</div>
        </div>

        <div class="receipt-title">קבלה מס' ${project.id} | תאריך: ${new Date().toLocaleDateString('he-IL')}</div>

        <div class="details-section">
          <h3>פרטי לקוח:</h3>
          <div class="row"><span>שם:</span> <span>${project.clientName}</span></div>
          <div class="row"><span>כתובת:</span> <span>${project.location}, ${project.street || ''} ${project.buildingNumber || ''}</span></div>
          <div class="row"><span>טלפון:</span> <span>${project.phoneNumber || 'לא צוין'}</span></div>
        </div>

        <div class="details-section">
          <h3>פירוט עבודה:</h3>
          <div class="row"><span>תיאור:</span> <span>${project.description}</span></div>
          <div class="row"><span>סכום ללא מע"מ:</span> <span>₪${totalPrice.toLocaleString()}</span></div>
          <div class="row"><span>מע"מ (${vatPercentage}%):</span> <span>₪${vatAmount.toLocaleString()}</span></div>
          <div class="row total-row"><span>סה"כ לתשלום:</span> <span>₪${totalWithVat.toLocaleString()}</span></div>
        </div>

        ${payments.length > 0 ? `
        <div class="details-section">
          <h3>פירוט תשלומים:</h3>
          <table class="payments-table">
            <thead>
              <tr><th>תאריך</th><th>סכום</th><th>הערות</th></tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${new Date(p.date).toLocaleDateString('he-IL')}</td>
                  <td>₪${Number(p.amount).toLocaleString()}</td>
                  <td>${p.note || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="row total-row">
            <span>סה"כ שולם:</span> 
            <span>₪${totalPaid.toLocaleString()}</span>
          </div>
          <div class="row">
            <span>יתרת חוב:</span> 
            <span>₪${(totalWithVat - totalPaid).toLocaleString()}</span>
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
          תודה על הבחירה בשירותינו!
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle>יצירת קבלה מעוצבת</DialogTitle>
      <DialogContent>
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" mb={2}>פרטי החברה (יופיעו בקבלה)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="שם החברה"
                value={companyDetails.name}
                onChange={(e) => setCompanyDetails({...companyDetails, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="מספר עסק"
                value={companyDetails.businessNumber}
                onChange={(e) => setCompanyDetails({...companyDetails, businessNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="כתובת"
                value={companyDetails.address}
                onChange={(e) => setCompanyDetails({...companyDetails, address: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="טלפון"
                value={companyDetails.phone}
                onChange={(e) => setCompanyDetails({...companyDetails, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="אימייל"
                value={companyDetails.email}
                onChange={(e) => setCompanyDetails({...companyDetails, email: e.target.value})}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, border: '2px solid #e0e0e0' }}>
          <Typography variant="h6" textAlign="center" mb={2}>
            תצוגה מקדימה של הקבלה
          </Typography>
          
          <Box textAlign="center" borderBottom="2px solid #333" pb={2} mb={3}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {companyDetails.name}
            </Typography>
            <Typography variant="body2">
              {companyDetails.address} | {companyDetails.phone}
            </Typography>
          </Box>

          <Typography variant="h6" mb={2}>
            קבלה מס' {project.id} | {new Date().toLocaleDateString('he-IL')}
          </Typography>

          <Box mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">פרטי לקוח:</Typography>
            <Typography>{project.clientName}</Typography>
            <Typography>{project.location}</Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">פירוט כספי:</Typography>
            <Box display="flex" justifyContent="space-between">
              <span>ללא מע"מ:</span><span>₪{totalPrice.toLocaleString()}</span>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <span>מע"מ ({vatPercentage}%):</span><span>₪{vatAmount.toLocaleString()}</span>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" fontWeight="bold">
              <span>סה"כ:</span><span>₪{totalWithVat.toLocaleString()}</span>
            </Box>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={generateReceipt} variant="contained">
          🖨️ הדפסת קבלה
        </Button>
        {project.phoneNumber && (
          <Button 
            onClick={() => sendReceiptByEmail()}
            variant="outlined"
            color="primary"
          >
            📧 שלח במייל
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};