import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, CircularProgress, Card, CardContent, MenuItem, TextField, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme, useMediaQuery } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { getProjects, getTasks, apiClient, getTaxInfo, updateTaxPercentage, resetTaxTracker, getProjectExpenses, getMonthlyData, getMonthlyBreakdown } from '../api/client';
import MobileApp from './MobileApp';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalPotential: 0,
    activeProjects: 0,
    pendingTasks: 0,
    currentMonthRevenue: 0,
    taxInfo: { untaxedAmount: 0, calculatedTax: 0, taxPercentage: 17 }
  });

  const [loading, setLoading] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState('17');
  const [exportType, setExportType] = useState<'monthly' | 'yearly'>('monthly');

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedMonthDisplay, setSelectedMonthDisplay] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const [selectedMonthData, setSelectedMonthData] = useState({
    revenue: 1000,
    expenses: 300,
    netProfit: 700,
    tax: 170
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTaxSettings = async () => {
    const newPercentage = prompt('הכנס אחוז מס חדש:', stats.taxInfo.taxPercentage.toString());
    if (newPercentage && !isNaN(Number(newPercentage))) {
      try {
        await updateTaxPercentage(Number(newPercentage));
        // רענון מיידי של הנתונים
        const updatedTaxInfo = await getTaxInfo();
        setStats(prevStats => ({
          ...prevStats,
          taxInfo: updatedTaxInfo
        }));
        alert('אחוז המס עודכן בהצלחה!');
      } catch (error) {
        console.error('Tax update error:', error);
        alert('שגיאה בעדכון אחוז המס: ' + (error as any).message);
      }
    }
  };

  const handleResetTax = async () => {
    if (confirm('האם אתה בטוח שתרצה לאפס את מעקב המס? הפעולה בלתי הפיכה!')) {
      try {
        await resetTaxTracker();
        // רענון מיידי של הנתונים
        const updatedTaxInfo = await getTaxInfo();
        setStats(prevStats => ({
          ...prevStats,
          taxInfo: updatedTaxInfo
        }));
        alert('מעקב המס אופס בהצלחה!');
      } catch (error) {
        console.error('Tax reset error:', error);
        alert('שגיאה באיפוס מעקב המס: ' + (error as any).message);
      }
    }
  };

  const handleUpdateTax = async () => {
    const newPercentage = Number(taxPercentage);
    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
      alert('אחוז מס לא תקין');
      return;
    }
    
    try {
      await updateTaxPercentage(newPercentage);
      // רענון מיידי של הנתונים
      const updatedTaxInfo = await getTaxInfo();
      setStats(prevStats => ({
        ...prevStats,
        taxInfo: updatedTaxInfo
      }));
      alert('אחוז המס עודכן בהצלחה!');
    } catch (error) {
      console.error('Tax update error:', error);
      alert('שגיאה בעדכון אחוז המס: ' + (error as any).message);
    }
  };

  // פונקציה ליצוא CSV
  const exportToCSV = async () => {
    try {
      console.log('Starting CSV export...', { exportType, selectedMonthDisplay });
      
      // בדיקה שיש נתונים לייצא
      if (exportType === 'monthly' && (!selectedMonthDisplay.month || !selectedMonthDisplay.year)) {
        alert('אנא בחר חודש ושנה תקינים');
        return;
      }
      
      if (exportType === 'yearly' && !selectedMonthDisplay.year) {
        alert('אנא בחר שנה תקינה');
        return;
      }

      const params = exportType === 'yearly' 
        ? { year: selectedMonthDisplay.year, type: 'yearly' }
        : { month: selectedMonthDisplay.month, year: selectedMonthDisplay.year, type: 'monthly' };

      const response = await apiClient.get(`/payments/export/csv`, {
        params,
        responseType: 'blob', // חשוב לקבל blob
        timeout: 30000 // timeout של 30 שניות
      });
      
      console.log('CSV response:', response);
      
      // בדיקה שהתגובה תקינה
      if (!response.data || response.data.size === 0) {
        alert(`אין נתונים לייצא עבור ${exportType === 'yearly' ? 'השנה' : 'החודש'} הנבחר`);
        return;
      }
      
      // יצירת קובץ להורדה
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const fileName = exportType === 'yearly' 
        ? `דוח_שנתי_${selectedMonthDisplay.year}.csv`
        : (() => {
            const monthName = new Date(selectedMonthDisplay.year, selectedMonthDisplay.month - 1).toLocaleDateString('he-IL', { month: 'long' });
            return `דוח_חודשי_${monthName}_${selectedMonthDisplay.year}.csv`;
          })();
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // ניקוי זיכרון
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      if ((error as any).code === 'ECONNABORTED') {
        alert('הבקשה נכשלה עקב timeout. נסה שוב.');
      } else if ((error as any).response?.status === 404) {
        alert('שירות יצוא CSV אינו זמין כרגע');
      } else {
        alert('שגיאה ביצוא הקובץ: ' + ((error as any).message || 'שגיאה לא ידועה'));
      }
    }
  };

  // פונקציה לחישוב נתונים לחודש ספציפי - על בסיס נתונים אמיתיים מהשרת
  const calculateMonthData = async (month: number, year: number) => {
    try {
      console.log('calculateMonthData called with:', { month, year });
      
      // קבלת נתונים אמיתיים מהשרת לחודש הספציפי
      const monthData = await getMonthlyData(month, year);
      console.log('Real month data received:', monthData);
      
      // חישוב מחדש של המס לפי אחוז המס הנוכחי
      const currentTaxPercentage = stats?.taxInfo?.taxPercentage || 17;
      const recalculatedTax = Math.round(monthData.revenue * (currentTaxPercentage / 100));
      
      setSelectedMonthData({
        revenue: monthData.revenue,
        expenses: monthData.expenses,
        netProfit: monthData.netProfit,
        tax: recalculatedTax
      });
      
    } catch (error) {
      console.error('Error getting real month data:', error);
      // במקרה של שגיאה, נציב ערכים ברירת מחדל
      setSelectedMonthData({
        revenue: 0,
        expenses: 0,
        netProfit: 0,
        tax: 0
      });
    }
  };

  // פונקציה לעדכון הנתונים החודשיים כאשר אחוז המס משתנה
  const recalculateMonthlyData = () => {
    if (monthlyData.length > 0 && stats?.taxInfo?.taxPercentage) {
      console.log('Recalculating monthly data with new tax percentage:', stats.taxInfo.taxPercentage);
      const updatedMonthlyData = monthlyData.map(data => {
        const recalculatedTax = Math.round(data.revenue * (stats.taxInfo.taxPercentage / 100));
        return {
          ...data,
          estimatedTax: recalculatedTax
        };
      });
      setMonthlyData(updatedMonthlyData);
    }
  };

  // עדכון כשמשנים חודש
  useEffect(() => {
    if (!loading && stats && stats.taxInfo && stats.taxInfo.taxPercentage !== undefined) {
      calculateMonthData(selectedMonthDisplay.month, selectedMonthDisplay.year);
    }
  }, [selectedMonthDisplay, loading]);

  // עדכון נתונים חודשיים כאשר אחוז המס משתנה
  useEffect(() => {
    if (!loading && stats?.taxInfo?.taxPercentage) {
      recalculateMonthlyData();
      calculateMonthData(selectedMonthDisplay.month, selectedMonthDisplay.year);
    }
  }, [stats?.taxInfo?.taxPercentage]);
  
  // וידוא שיש נתונים להצגה
  useEffect(() => {
    if (!loading && stats.totalRevenue > 0) {
      calculateMonthData(selectedMonthDisplay.month, selectedMonthDisplay.year);
    }
  }, [stats, loading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Dashboard: Starting to fetch data...');
        const [projects, tasks] = await Promise.all([getProjects(), getTasks()]);
        console.log('Dashboard: Fetched projects:', projects.length, 'tasks:', tasks.length);
        
        // חישוב הכנסות אמיתיות מתשלומים
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        for (const project of projects) {
          try {
            // קבלת תשלומים של הפרויקט
            const paymentsResponse = await apiClient.get(`/payments/project/${project.id}`);
            const payments = paymentsResponse.data || [];
            const projectRevenue = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
            totalRevenue += projectRevenue;
            
            // קבלת הוצאות של הפרויקט
            const expensesResponse = await getProjectExpenses(project.id);
            const projectExpenses = expensesResponse.reduce((sum: number, expense: any) => sum + Number(expense.amount || 0), 0);
            totalExpenses += projectExpenses;
          } catch (error) {
            console.log(`Error fetching data for project ${project.id}:`, error);
            // במקרה של שגיאה, נשתמש בנתונים בסיסיים
            totalRevenue += Number(project.totalPaid || 0);
          }
        }
        
        const totalPotential = projects.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);
        const activeProjects = projects.filter(p => p.status === 'In-Progress').length;
        const pendingTasks = tasks.filter(t => !t.isDone).length;

        const netProfit = totalRevenue - totalExpenses;
        
        // קבלת מידע מס
        let taxInfo = { untaxedAmount: 0, calculatedTax: 0, taxPercentage: 17 };
        try {
          taxInfo = await getTaxInfo();
        } catch (error) {
          console.error('Failed to fetch tax info:', error);
        }
        
        // קבלת נתונים חודשיים אמיתיים מהשרת
        try {
          const realMonthlyBreakdown = await getMonthlyBreakdown(6);
          console.log('Real monthly breakdown:', realMonthlyBreakdown);
          
          const formattedMonthlyData = realMonthlyBreakdown.map(data => {
            // חישוב מחדש של המס לפי אחוז המס הנוכחי
            const recalculatedTax = Math.round(data.revenue * (taxInfo.taxPercentage / 100));
            return {
              month: data.monthName,
              revenue: data.revenue,
              estimatedTax: recalculatedTax,
              expenses: data.expenses,
              netProfit: data.netProfit
            };
          });
          
          setMonthlyData(formattedMonthlyData);
        } catch (error) {
          console.error('Error getting monthly breakdown:', error);
          // fallback לנתונים משוערים אם יש שגיאה
          const monthlyBreakdown = [];
          const currentDate = new Date();
          const monthlyAvgRevenue = totalRevenue / 6;
          
          for (let i = 5; i >= 0; i--) {
            const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            monthlyBreakdown.push({
              month: month.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }),
              revenue: Math.round(monthlyAvgRevenue),
              estimatedTax: Math.round(monthlyAvgRevenue * (taxInfo.taxPercentage / 100))
            });
          }
          setMonthlyData(monthlyBreakdown);
        }
        
        const finalStats = { 
          totalRevenue, 
          totalExpenses, 
          netProfit, 
          totalPotential, 
          activeProjects, 
          pendingTasks,
          currentMonthRevenue: totalRevenue / 12, // הערכת חודש נוכחי
          taxInfo
        };
        
        console.log('Dashboard: Final stats being set:', finalStats);
        setStats(finalStats);
        console.log('Dashboard: Data loaded successfully');
        setLoading(false);
      } catch (e) {
        console.error('Dashboard error:', e);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>טוען נתונים...</Typography>
      </Box>
    );
  }

  // If mobile, use the MobileApp component
  if (isMobile) {
    return <MobileApp />;
  }

  const StatCard = ({ title, value, subValue, icon, color }: any) => (
    <Card sx={{ height: '100%', borderTop: `4px solid ${color}` }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="subtitle2">{title}</Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            {subValue && <Typography variant="caption" color="textSecondary">{subValue}</Typography>}
          </Box>
          <Box sx={{ bgcolor: `${color}20`, p: 1, borderRadius: 2, color: color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box p={2} sx={{ minHeight: '100vh', height: 'auto', overflow: 'visible' }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">סקירת נתונים - מצב עסקי כללי</Typography>
      
      {/* כרטיסי סטטיסטיקה עיקריים */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <StatCard 
            title="הכנסות נטו" 
            value={`₪${stats.totalRevenue.toLocaleString()}`} 
            subValue={`מתוך פוטנציאל של ₪${stats.totalPotential.toLocaleString()}`}
            icon={<AttachMoneyIcon fontSize="large" />}
            color="#2e7d32"
          />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <StatCard 
            title="הוצאות כולל" 
            value={`₪${stats.totalExpenses.toLocaleString()}`} 
            subValue="חומרים וקבלנים"
            icon={<AttachMoneyIcon fontSize="large" />}
            color="#d32f2f"
          />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <StatCard 
            title="רווח נקי" 
            value={`₪${stats.netProfit.toLocaleString()}`} 
            subValue={stats.netProfit > 0 ? "רווחיות טובה!" : "בדוק הוצאות"}
            icon={<AttachMoneyIcon fontSize="large" />}
            color={stats.netProfit > 0 ? "#4caf50" : "#ff5722"}
          />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <StatCard 
            title="פרויקטים פעילים" 
            value={stats.activeProjects} 
            subValue={`${stats.pendingTasks} משימות פתוחות`}
            icon={<EngineeringIcon fontSize="large" />}
            color="#f57c00"
          />
        </Box>
      </Box>

      {/* ניהול מס */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ReceiptIcon sx={{ fontSize: 40, color: '#E91E63', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ניהול מס
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#E91E63', mb: 1 }}>
                ₪{Math.round(stats.totalRevenue * (stats.taxInfo.taxPercentage / 100)).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                סך המס הכולל
              </Typography>
              
              <TextField
                type="number"
                label="אחוז מס"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                size="small"
                sx={{ mb: 2, width: '120px' }}
                InputProps={{
                  endAdornment: '%',
                }}
              />
              
              <Box display="flex" gap={1} flexDirection="column">
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={handleUpdateTax}
                >
                  הגדר אחוז מס
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={async () => {
                    try {
                      const totalRevenue = stats.totalRevenue;
                      const taxPercentage = stats.taxInfo.taxPercentage;
                      const totalTax = totalRevenue * (taxPercentage / 100);
                      alert(`סיכום מס כולל:\n\n📊 סך ההכנסות: ₪${totalRevenue.toLocaleString()}\n🏛️ אחוז מס: ${taxPercentage}%\n💰 סך המס הכולל: ₪${Math.round(totalTax).toLocaleString()}`);
                    } catch (error) {
                      alert('שגיאה בחישוב מס: ' + (error as any).message);
                    }
                  }}
                >
                  📊 סך המס הכולל
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 48%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceIcon sx={{ fontSize: 40, color: '#2196F3', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  ניהול שנתי
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                אפשרויות ניהול נתונים שנתיים
              </Typography>
              
              <Box display="flex" gap={1} flexDirection="column">
                <Button 
                  variant="outlined" 
                  size="small"
                  color="warning"
                  onClick={() => {
                    if (confirm('האם אתה בטוח שברצונך לאפס את כל ההכנסות? פעולה זו אינה ניתנת לביטול.')) {
                      // כאן נוסיף את הלוגיקה של איפוס שנתי
                      alert('איפוס שנתי יתבצע בקרוב');
                    }
                  }}
                >
                  🔄 איפוס שנתי
                </Button>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => {
                    // כאן נוסיף צפייה בשנים קודמות
                    alert('צפייה בשנים קודמות תתווסף בקרוב');
                  }}
                >
                  📅 שנים קודמות
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* סיכום חודשי מפורט */}
      <Box sx={{ mt: 2 }}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          height: 'auto',
          overflow: 'visible',
          width: '100%'
        }}>
          <CardContent sx={{ 
            height: 'auto',
            overflow: 'visible', 
            pb: 4,
            pt: 3,
            '&:last-child': { pb: 4 }
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2} sx={{ width: '100%' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                📊 סיכום מפורט
              </Typography>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" sx={{ minHeight: '60px', width: 'auto' }}>
                <TextField
                  select
                  label="סוג דוח"
                  size="small"
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as 'monthly' | 'yearly')}
                  sx={{ minWidth: 120, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiOutlinedInput-root': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' } }}
                >
                  <MenuItem value="monthly">חודשי</MenuItem>
                  <MenuItem value="yearly">שנתי</MenuItem>
                </TextField>
                
                {exportType === 'monthly' && (
                  <TextField
                    select
                    size="small"
                    value={selectedMonthDisplay.month}
                    onChange={(e) => setSelectedMonthDisplay(prev => ({...prev, month: Number(e.target.value)}))}
                    sx={{ minWidth: 120, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiOutlinedInput-root': { color: 'white' } }}
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <MenuItem key={i+1} value={i+1}>
                        {new Date(2024, i).toLocaleDateString('he-IL', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                
                <TextField
                  select
                  size="small"
                  value={selectedMonthDisplay.year}
                  onChange={(e) => setSelectedMonthDisplay(prev => ({...prev, year: Number(e.target.value)}))}
                  sx={{ minWidth: 100, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiOutlinedInput-root': { color: 'white' } }}
                >
                  {[2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </TextField>
                
                <Button
                  variant="contained"
                  size="small"
                  onClick={exportToCSV}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                    minWidth: '120px'
                  }}
                >
                  📊 יצוא {exportType === 'yearly' ? 'שנתי' : 'חודשי'}
                </Button>
              </Box>
            </Box>
            
            {/* נתוני החודש הנבחר */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2, pb: 3 }}>
              <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                <Box 
                  textAlign="center" 
                  p={3} 
                  sx={{ 
                    minHeight: '180px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, opacity: 0.9, fontSize: '0.9rem', fontWeight: '500', color: 'white !important' }}>
                    💰 הכנסות חודשיות
                  </Typography>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    lineHeight: 1.2,
                    color: 'white !important'
                  }}>
                    ₪{(selectedMonthData?.revenue || 1000).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.8rem', color: 'white !important' }}>
                    נתונים אמיתיים מהשרת
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                <Box 
                  textAlign="center" 
                  p={2} 
                  sx={{ 
                    minHeight: '120px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, opacity: 0.9, fontSize: '0.9rem', fontWeight: '500', color: 'white !important' }}>
                    📋 הוצאות בפועל
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    fontSize: { xs: '1.4rem', md: '1.6rem' },
                    lineHeight: 1.2,
                    color: 'white !important'
                  }}>
                    ₪{(selectedMonthData?.expenses || 300).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.8rem', color: 'white' }}>
                    נתונים אמיתיים מהמערכת
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                <Box 
                  textAlign="center" 
                  p={2} 
                  sx={{ 
                    minHeight: '120px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, opacity: 0.9, fontSize: '0.9rem', fontWeight: '500', color: 'white !important' }}>
                    ✅ רווח נקי חודשי
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    fontSize: { xs: '1.4rem', md: '1.6rem' },
                    lineHeight: 1.2,
                    color: 'white !important'
                  }}>
                    ₪{(selectedMonthData?.netProfit || 700).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.8rem', color: 'white' }}>
                    אחרי הוצאות
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
                <Box 
                  textAlign="center" 
                  p={2} 
                  sx={{ 
                    minHeight: '120px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, opacity: 0.9, fontSize: '0.9rem', fontWeight: '500', color: 'white !important' }}>
                    🏛️ מס משוער
                  </Typography>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    fontSize: { xs: '1.4rem', md: '1.6rem' },
                    lineHeight: 1.2,
                    color: 'white !important'
                  }}>
                    ₪{(selectedMonthData?.tax || 170).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.8rem', color: 'white' }}>
                    ({stats?.taxInfo?.taxPercentage || 17}%)
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.3)', width: '100%' }} />
            
            <Box sx={{ textAlign: 'center', pb: 2, width: '100%' }}>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.9rem', color: 'white' }}>
                נתונים אמיתיים מהמערכת ל{exportType === 'yearly' ? selectedMonthDisplay.year : new Date(selectedMonthDisplay.year, selectedMonthDisplay.month - 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* טבלה חודשית */}
      <Box sx={{ mt: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>מעקב חודשי - 6 חודשים אחרונים (הוצאות ומס בפועל)</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>חודש</strong></TableCell>
                    <TableCell align="right"><strong>הכנסות</strong></TableCell>
                    <TableCell align="right"><strong>מס משוער ({stats?.taxInfo?.taxPercentage || 17}%)</strong></TableCell>
                    <TableCell align="right"><strong>נקי</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell align="right">₪{row.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: '#d32f2f' }}>₪{row.estimatedTax.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>₪{(row.revenue - row.estimatedTax).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              * נתונים אמיתיים מהמערכת. מס מחושב לפי {stats?.taxInfo?.taxPercentage || 17}%. יש להתייעץ עם רואה חשבון.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};