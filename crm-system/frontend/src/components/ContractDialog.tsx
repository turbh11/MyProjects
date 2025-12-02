import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip
} from '@mui/material';
import { Project } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

const contractTemplates = {
  construction: {
    name: 'הסכם עבודות בנייה',
    template: `הסכם לביצוע עבודות בנייה

בין: {companyName} (ח.פ {businessNumber})
לבין: {clientName}, ת.ז {clientId}
כתובת: {clientAddress}
טלפון: {clientPhone}

נושא העבודה: {workDescription}
מיקום העבודה: {workLocation}
תאריך התחלה משוער: {startDate}
משך העבודה המשוער: {duration} ימי עבודה

פירוט כספי:
- סכום העבודה ללא מע"מ: {priceWithoutVat} ש"ח
- מע"מ ({vatPercentage}%): {vatAmount} ש"ח  
- סה"כ לתשלום: {totalPrice} ש"ח

תנאי תשלום:
{paymentTerms}

התחייבויות הקבלן:
- ביצוע העבודה לפי התקנים הנדרשים
- אחריות לעבודה למשך {warrantyPeriod} חודשים
- ניקיון האתר בסיום העבודה

התחייבויות הלקוח:
- תשלום לפי לוח הזמנים המוסכם
- מתן גישה לאתר העבודה
- אישורים נדרשים מרשויות מקומיות

חתימות:
קבלן: _________________    לקוח: _________________
תאריך: {currentDate}        תאריך: {currentDate}`
  },
  
  design: {
    name: 'הסכם עיצוב ותכנון',
    template: `הסכם עיצוב ותכנון

בין: {companyName} (ח.פ {businessNumber})
לבין: {clientName}
כתובת: {clientAddress}
טלפון: {clientPhone}

היקף העבודה:
{workDescription}

שלבי העבודה:
1. סקר ומדידות ראשוניות
2. הכנת תכניות ראשוניות
3. פיתוח הצעה מפורטת
4. ליווי ביצוע (אופציונלי)

עלות השירות:
- עלות התכנון: {priceWithoutVat} ש"ח + מע"מ
- סה"כ לתשלום: {totalPrice} ש"ח

לוחות זמנים:
- זמן אספקה: {deliveryTime} ימים
- תוקף ההצעה: 30 יום

זכויות יוצרים:
כל הזכויות שמורות לקבלן עד לתשלום מלא.

חתימות:
מעצב: _________________   לקוח: _________________`
  },

  maintenance: {
    name: 'הסכם תחזוקה',
    template: `הסכם תחזוקה שוטפת

בין: {companyName}
לבין: {clientName}
נכס: {workLocation}

היקף השירות:
{workDescription}

תדירות ביקורים:
- ביקור תחזוקה כל {maintenanceFrequency}
- זמינות לקריאות דחופות: 24/7

עלות שנתית: {totalPrice} ש"ח
חלוקה ל-{paymentInstallments} תשלומים

התחייבויות:
- זמן תגובה מקסימלי: {responseTime} שעות
- זמינות חלקי חילוף
- אחריות לעבודות התחזוקה

תקופת ההסכם: שנה אחת, עם אפשרות הארכה.

חתימות:
נותן השירות: ___________   לקוח: ___________`
  }
};

export const ContractDialog = ({ open, onClose, project }: Props) => {
  const [selectedTemplate, setSelectedTemplate] = useState('construction');
  const [contractData, setContractData] = useState({
    companyName: 'שם החברה שלך',
    businessNumber: '123456789',
    clientId: '',
    paymentTerms: 'תשלום בשני שלבים: 50% בתחילת העבודה, 50% בסיום',
    warrantyPeriod: '12',
    duration: '30',
    deliveryTime: '14',
    maintenanceFrequency: '3 חודשים', 
    paymentInstallments: '4',
    responseTime: '24'
  });

  const [generatedContract, setGeneratedContract] = useState('');

  useEffect(() => {
    if (project) {
      generateContract();
    }
  }, [selectedTemplate, contractData, project]);

  const generateContract = () => {
    if (!project) return;

    const template = contractTemplates[selectedTemplate as keyof typeof contractTemplates];
    const vatPercentage = Number(project.vatPercentage || 17);
    const totalPrice = Number(project.totalPrice || 0);
    const vatAmount = Math.round(totalPrice * (vatPercentage / 100) * 100) / 100;
    const totalWithVat = totalPrice + vatAmount;

    const replacements = {
      companyName: contractData.companyName,
      businessNumber: contractData.businessNumber,
      clientName: project.clientName,
      clientId: contractData.clientId,
      clientAddress: `${project.location}, ${project.street || ''} ${project.buildingNumber || ''}`.trim(),
      clientPhone: project.phoneNumber || 'לא צוין',
      workDescription: project.description,
      workLocation: project.location,
      priceWithoutVat: totalPrice.toLocaleString(),
      vatPercentage: vatPercentage.toString(),
      vatAmount: vatAmount.toLocaleString(),
      totalPrice: totalWithVat.toLocaleString(),
      currentDate: new Date().toLocaleDateString('he-IL'),
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL'),
      paymentTerms: contractData.paymentTerms,
      warrantyPeriod: contractData.warrantyPeriod,
      duration: contractData.duration,
      deliveryTime: contractData.deliveryTime,
      maintenanceFrequency: contractData.maintenanceFrequency,
      paymentInstallments: contractData.paymentInstallments,
      responseTime: contractData.responseTime
    };

    let contract = template.template;
    Object.entries(replacements).forEach(([key, value]) => {
      contract = contract.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    setGeneratedContract(contract);
  };

  const sendContractByEmail = async () => {
    if (!project || !project.phoneNumber) {
      alert('לא נמצא כתובת מייל');
      return;
    }
    
    try {
      const response = await fetch('/api/email/send-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          clientEmail: project.phoneNumber,
          clientName: project.clientName,
          contractContent: generatedContract,
          contractType: contractTemplates[selectedTemplate as keyof typeof contractTemplates].name
        })
      });
      
      if (response.ok) {
        alert('ההסכם נשלח במייל!');
      } else {
        alert('שגיאה בשליחת המייל');
      }
    } catch (error) {
      alert('שגיאה בשליחת המייל');
    }
  };

  const printContract = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>הסכם - ${project?.clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { text-align: center; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .contract-content { white-space: pre-line; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>${contractTemplates[selectedTemplate as keyof typeof contractTemplates].name}</h1>
          <div class="contract-content">${generatedContract}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth dir="rtl">
      <DialogTitle>יצירת הסכם אוטומטי</DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>סוג הסכם</InputLabel>
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {Object.entries(contractTemplates).map(([key, template]) => (
                <MenuItem key={key} value={key}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" mb={2}>הגדרות הסכם</Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <TextField
              label="שם החברה"
              value={contractData.companyName}
              onChange={(e) => setContractData({...contractData, companyName: e.target.value})}
              sx={{ minWidth: 200 }}
            />
            <TextField
              label="ח.פ/ע.מ"
              value={contractData.businessNumber}
              onChange={(e) => setContractData({...contractData, businessNumber: e.target.value})}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="ת.ז לקוח"
              value={contractData.clientId}
              onChange={(e) => setContractData({...contractData, clientId: e.target.value})}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="משך עבודה (ימים)"
              type="number"
              value={contractData.duration}
              onChange={(e) => setContractData({...contractData, duration: e.target.value})}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="אחריות (חודשים)"
              type="number"
              value={contractData.warrantyPeriod}
              onChange={(e) => setContractData({...contractData, warrantyPeriod: e.target.value})}
              sx={{ minWidth: 150 }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="תנאי תשלום"
            value={contractData.paymentTerms}
            onChange={(e) => setContractData({...contractData, paymentTerms: e.target.value})}
            sx={{ mt: 2 }}
          />
        </Paper>

        <Paper sx={{ p: 3, border: '1px solid #ddd', maxHeight: 500, overflow: 'auto' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h6">תצוגה מקדימה</Typography>
            <Chip label={contractTemplates[selectedTemplate as keyof typeof contractTemplates].name} sx={{ ml: 2 }} />
          </Box>
          <Typography component="pre" sx={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
            {generatedContract}
          </Typography>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={() => navigator.clipboard.writeText(generatedContract)}>
          📋 העתק לכרטיס
        </Button>
        <Button onClick={printContract} variant="contained">
          🖨️ הדפס הסכם
        </Button>
        {project && project.phoneNumber && (
          <Button 
            onClick={() => sendContractByEmail()}
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