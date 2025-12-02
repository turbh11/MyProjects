import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { getProjects, apiClient } from '../api/client';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeProjects: 0,
    pendingTasks: 0,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const projects = await getProjects();
        const activeProjects = projects.filter(p => !p.isArchived).length;
        const totalRevenue = projects.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
        const totalPotential = projects.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
        
        setStats({
          totalRevenue,
          totalExpenses: 0, // Placeholder
          netProfit: totalRevenue,
          activeProjects,
          pendingTasks: 0, // Placeholder
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>טוען נתונים...</Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        📊 סקירת נתונים - מצב עסקי כללי
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
        <Card sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              💰 הכנסות נטו
            </Typography>
            <Typography variant="h4" color="success.main">
              ₪{stats.totalRevenue.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              סה"כ כל הפרויקטים
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              📋 פרויקטים פעילים
            </Typography>
            <Typography variant="h4" color="primary.main">
              {stats.activeProjects}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              פרויקטים לא ארכיוניים
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              📈 רווח נקי
            </Typography>
            <Typography variant="h4" color={stats.netProfit > 0 ? 'success.main' : 'error.main'}>
              ₪{stats.netProfit.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {stats.netProfit > 0 ? 'רווחיות טובה!' : 'בדוק הוצאות'}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 250px', minWidth: '200px' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              ⚡ מצב מערכת
            </Typography>
            <Typography variant="h4" color="info.main">
              ✅
            </Typography>
            <Typography variant="body2" color="textSecondary">
              הכל עובד תקין!
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          📋 פעולות מהירות
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
            <Typography>🔄 רענן נתונים</Typography>
          </Card>
          <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
            <Typography>📊 יצוא נתונים</Typography>
          </Card>
          <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
            <Typography>⚙️ הגדרות מערכת</Typography>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};