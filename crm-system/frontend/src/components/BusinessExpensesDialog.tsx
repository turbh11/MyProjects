import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/Upload';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { apiClient } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

const expenseCategories = [
  { value: 'fuel', label: '⛽ דלק' },
  { value: 'materials', label: '🔧 חומרים' },
  { value: 'tools', label: '🛠️ כלים' },
  { value: 'transportation', label: '🚗 תחבורה' },
  { value: 'office', label: '🏢 משרד' },
  { value: 'professional_services', label: '👨‍💼 שירותים מקצועיים' },
  { value: 'insurance', label: '🛡️ ביטוח' },
  { value: 'phone', label: '📱 טלפון' },
  { value: 'other', label: '📦 אחר' }
];

interface BusinessExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  supplierName?: string;
  invoiceNumber?: string;
  receiptPath?: string;
  projectId?: number;
  project?: { clientName: string };
  isTaxDeductible: boolean;
  taxDeductiblePercentage: number;
  notes?: string;
  createdAt: string;
}

export const BusinessExpensesDialog = ({ open, onClose }: Props) => {
  const [tab, setTab] = useState(0);
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearlyReport, setYearlyReport] = useState<any>(null);
  
  // טופס הוספת הוצאה חדשה
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'other',
    expenseDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    invoiceNumber: '',
    projectId: '',
    isTaxDeductible: true,
    taxDeductiblePercentage: 100,
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);

  const handleViewReceipt = (expense: any) => {
    if (expense.receiptPath) {
      // פתיחת החשבונית בחלון חדש
      const receiptUrl = `/api/business-expenses/receipt/${expense.id}`;
      window.open(receiptUrl, '_blank');
    }
  };

  const handleDownloadAllReceipts = async () => {
    try {
      const response = await fetch(`/api/business-expenses/download-receipts/${selectedYear}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipts-${selectedYear}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading receipts:', error);
      alert('שגיאה בהורדת החשבוניות');
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/business-expenses/export-report/${selectedYear}?format=${format}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${selectedYear}.${format === 'pdf' ? 'pdf' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('שגיאה ביצוא הדוח');
    }
  };

  useEffect(() => {
    if (open) {
      loadExpenses();
      loadProjects();
    }
  }, [open, selectedYear]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/business-expenses?year=${selectedYear}`);
      setExpenses(response.data);
    } catch (error) {
      console.error('שגיאה בטעינת הוצאות:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await apiClient.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('שגיאה בטעינת פרויקטים:', error);
    }
  };

  const loadYearlyReport = async () => {
    try {
      const response = await apiClient.get(`/business-expenses/yearly-report/${selectedYear}`);
      setYearlyReport(response.data);
    } catch (error) {
      console.error('שגיאה בטעינת דוח שנתי:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('יש למלא תיאור וסכום');
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(newExpense).forEach(([key, value]) => {
        if (value !== '') formData.append(key, value.toString());
      });
      
      if (selectedFile) {
        formData.append('receipt', selectedFile);
      }

      await apiClient.post('/business-expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setNewExpense({
        description: '',
        amount: '',
        category: 'other',
        expenseDate: new Date().toISOString().split('T')[0],
        supplierName: '',
        invoiceNumber: '',
        projectId: '',
        isTaxDeductible: true,
        taxDeductiblePercentage: 100,
        notes: ''
      });
      setSelectedFile(null);
      loadExpenses();
      alert('הוצאה נוספה בהצלחה!');
    } catch (error) {
      console.error('שגיאה בהוספת הוצאה:', error);
      alert('שגיאה בהוספת הוצאה');
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('האם למחוק הוצאה זו?')) return;

    try {
      await apiClient.delete(`/business-expenses/${id}`);
      loadExpenses();
      alert('הוצאה נמחקה בהצלחה!');
    } catch (error) {
      console.error('שגיאה במחיקת הוצאה:', error);
      alert('שגיאה במחיקת הוצאה');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    return expenseCategories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <ReceiptIcon sx={{ mr: 1, color: '#f57c00' }} />
          <Typography variant="h6">ניהול הוצאות עסקיות</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={(_, newTab) => setTab(newTab)} sx={{ mb: 2 }}>
          <Tab label="הוספת הוצאה" />
          <Tab label="רשימת הוצאות" />
          <Tab label="דוח שנתי" />
        </Tabs>

        {/* הוספת הוצאה חדשה */}
        {tab === 0 && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="תיאור ההוצאה"
                  fullWidth
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="דלק, חומרים, כלים..."
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="סכום"
                  type="number"
                  fullWidth
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="תאריך"
                  type="date"
                  fullWidth
                  value={newExpense.expenseDate}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, expenseDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>קטגוריה</InputLabel>
                  <Select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {expenseCategories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="שם הספק"
                  fullWidth
                  value={newExpense.supplierName}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, supplierName: e.target.value }))}
                  placeholder="תחנת דלק, חנות חומרים..."
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="מספר חשבונית"
                  fullWidth
                  value={newExpense.invoiceNumber}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>פרויקט (אופציונלי)</InputLabel>
                  <Select
                    value={newExpense.projectId}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, projectId: e.target.value }))}
                  >
                    <MenuItem value="">ללא פרויקט</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.clientName} - {project.location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newExpense.isTaxDeductible}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, isTaxDeductible: e.target.checked }))}
                    />
                  }
                  label="זכאי לניכוי במס"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="אחוז ניכוי במס (%)"
                  type="number"
                  fullWidth
                  value={newExpense.taxDeductiblePercentage || 100}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, taxDeductiblePercentage: Number(e.target.value) }))}
                  InputProps={{ 
                    inputProps: { min: 0, max: 100 },
                    endAdornment: <span style={{color: '#666'}}>%</span>
                  }}
                  helperText="0-100% מההוצאה"
                  disabled={!newExpense.isTaxDeductible}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="הערות"
                  fullWidth
                  multiline
                  rows={2}
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload">
                  <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                    העלאת קבלה/חשבונית
                  </Button>
                </label>
                {selectedFile && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                    נבחר קובץ: {selectedFile.name}
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleAddExpense}
                disabled={!newExpense.description || !newExpense.amount}
              >
                הוספת הוצאה
              </Button>
            </Box>
          </Box>
        )}

        {/* רשימת הוצאות */}
        {tab === 1 && (
          <Box>
            <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>שנה</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                סה"כ הוצאות: {formatCurrency(expenses.reduce((sum, expense) => sum + Number(expense.amount), 0))}
              </Typography>
            </Box>

            {loading ? (
              <Typography>טוען הוצאות...</Typography>
            ) : expenses.length === 0 ? (
              <Alert severity="info">אין הוצאות עבור שנת {selectedYear}</Alert>
            ) : (
              <List>
                {expenses.map((expense) => (
                  <Paper key={expense.id} sx={{ mb: 1 }}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">{expense.description}</Typography>
                            <Chip label={getCategoryLabel(expense.category)} size="small" />
                            {expense.isTaxDeductible && (
                              <Chip 
                                label={`ניכוי ${expense.taxDeductiblePercentage || 100}%`} 
                                size="small" 
                                color={expense.taxDeductiblePercentage === 100 ? "success" : "warning"} 
                              />
                            )}
                            {expense.receiptPath && (
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewReceipt(expense)}
                                title="צפייה בחשבונית"
                                sx={{ color: '#1976d2' }}
                              >
                                📄
                              </IconButton>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {formatCurrency(expense.amount)} • {new Date(expense.expenseDate).toLocaleDateString('he-IL')}
                            </Typography>
                            {expense.supplierName && (
                              <Typography variant="body2" color="textSecondary">
                                ספק: {expense.supplierName}
                              </Typography>
                            )}
                            {expense.project && (
                              <Typography variant="body2" color="primary">
                                פרויקט: {expense.project.clientName}
                              </Typography>
                            )}
                            {expense.invoiceNumber && (
                              <Typography variant="body2" color="textSecondary">
                                חשבונית: {expense.invoiceNumber}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box display="flex" flexDirection="column" gap={1}>
                        {expense.receiptPath && (
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleViewReceipt(expense)}
                            sx={{ minWidth: '120px' }}
                          >
                            צפה בקבלה
                          </Button>
                        )}
                        <IconButton onClick={() => deleteExpense(expense.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* דוח שנתי */}
        {tab === 2 && (
          <Box>
            <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>שנה</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={loadYearlyReport}
                sx={{ ml: 2 }}
              >
                טעינת דוח
              </Button>
            </Box>

            {yearlyReport && (
              <Box>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <Typography variant="h6">דוח שנתי {selectedYear}</Typography>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={handleDownloadAllReceipts}
                      startIcon={<span>📁</span>}
                    >
                      הורד כל החשבוניות
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleExportReport('excel')}
                      startIcon={<span>📊</span>}
                    >
                      יצא אקסל
                    </Button>
                  </div>
                </div>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{backgroundColor: '#f5f5f5'}}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">סה"כ הוצאות</Typography>
                        <Typography variant="h4" color="primary">
                          {formatCurrency(yearlyReport.totalExpenses || 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{backgroundColor: '#e8f5e8'}}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="success.main">זכאי לניכוי</Typography>
                        <Typography variant="h4" color="success.main">
                          {formatCurrency(yearlyReport.taxDeductibleExpenses || 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{backgroundColor: '#fff3e0'}}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="orange">חיסכון במס (30%)</Typography>
                        <Typography variant="h4" color="orange">
                          {formatCurrency(Math.round((yearlyReport.taxDeductibleExpenses || 0) * 0.3))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {yearlyReport.byCategory && Object.keys(yearlyReport.byCategory).length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>פירוט לפי קטגוריות:</Typography>
                    <Grid container spacing={1}>
                      {Object.entries(yearlyReport.byCategory).map(([category, amount]) => (
                        <Grid item xs={12} sm={6} key={category}>
                          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography>
                              {getCategoryLabel(category)}
                            </Typography>
                            <Typography fontWeight="bold">
                              {formatCurrency(Number(amount))}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
};