import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getProjectExpenses, addExpense, updateExpense, deleteExpense } from '../api/client';
import type { Expense } from '../api/client';

interface Props {
  projectId: number;
}

const expenseCategories = [
  'חומרי בניין',
  'כלי עבודה',
  'קבלן משנה',
  'דלק ונסיעות',
  'אישורים ורישיונות',
  'ציוד מקצועי',
  'אחר'
];

export const ExpenseWidget = ({ projectId }: Props) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'חומרי בניין',
    date: new Date().toISOString().split('T')[0]
  });

  const loadExpenses = async () => {
    try {
      const data = await getProjectExpenses(projectId);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [projectId]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description) {
      alert('נא למלא את כל השדות הנדרשים');
      return;
    }

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        projectId,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      loadExpenses();
      setIsDialogOpen(false);
      setEditingExpense(null);
      setFormData({ amount: '', description: '', category: 'חומרי בניין', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      alert('שגיאה בשמירת ההוצאה');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: expense.date.split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('האם למחוק הוצאה זו?')) {
      try {
        await deleteExpense(id);
        loadExpenses();
      } catch (error) {
        alert('שגיאה במחיקת ההוצאה');
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'חומרי בניין': '#f44336',
      'כלי עבודה': '#ff9800',
      'קבלן משנה': '#9c27b0',
      'דלק ונסיעות': '#2196f3',
      'אישורים ורישיונות': '#4caf50',
      'ציוד מקצועי': '#795548',
      'אחר': '#607d8b'
    };
    return colors[category] || '#607d8b';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">הוצאות הפרויקט</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingExpense(null);
            setFormData({ amount: '', description: '', category: 'חומרי בניין', date: new Date().toISOString().split('T')[0] });
            setIsDialogOpen(true);
          }}
        >
          הוצאה חדשה
        </Button>
      </Box>

      <Box mb={2} p={2} bgcolor="error.light" borderRadius={1}>
        <Typography variant="h6" color="white">
          סך הוצאות: ₪{totalExpenses.toLocaleString()}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>תאריך</TableCell>
              <TableCell>תיאור</TableCell>
              <TableCell>קטגוריה</TableCell>
              <TableCell align="right">סכום</TableCell>
              <TableCell align="center">פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  {new Date(expense.date).toLocaleDateString('he-IL')}
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  <Chip
                    label={expense.category}
                    size="small"
                    sx={{ bgcolor: getCategoryColor(expense.category), color: 'white' }}
                  />
                </TableCell>
                <TableCell align="right">₪{Number(expense.amount).toLocaleString()}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleEdit(expense)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(expense.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  אין הוצאות רשומות
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle>{editingExpense ? 'עריכת הוצאה' : 'הוצאה חדשה'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="סכום"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="תיאור"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="קטגוריה"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            margin="normal"
          >
            {expenseCategories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="תאריך"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingExpense ? 'עדכן' : 'שמור'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};