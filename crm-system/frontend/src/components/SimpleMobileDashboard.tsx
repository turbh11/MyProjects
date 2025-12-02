import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';

interface SimpleMobileDashboardProps {
  stats?: any;
}

export const SimpleMobileDashboard: React.FC<SimpleMobileDashboardProps> = ({ stats }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) {
    return null;
  }

  return (
    <Box p={2} sx={{ direction: 'rtl' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: '#1976d2', fontWeight: 'bold' }}>
        מערכת CRM נייד
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#e3f2fd', border: '2px solid #1976d2' }}>
            <CardContent>
              <Typography variant="h6" sx={{ textAlign: 'center' }}>
                המערכת עולה בהצלחה!
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
                אנא המתן כמה שניות עד שכל הרכיבים ייטענו
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">💰</Typography>
              <Typography variant="body1">הכנסות</Typography>
              <Typography variant="h6">₪{stats?.totalRevenue?.toLocaleString() || '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">📊</Typography>
              <Typography variant="body1">פרויקטים</Typography>
              <Typography variant="h6">{stats?.activeProjects || '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">💳</Typography>
              <Typography variant="body1">הוצאות</Typography>
              <Typography variant="h6">₪{stats?.totalExpenses?.toLocaleString() || '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5">📈</Typography>
              <Typography variant="body1">רווח נקי</Typography>
              <Typography variant="h6">₪{stats?.netProfit?.toLocaleString() || '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
          📱 גרסת נייד מותאמת לטלפון שלך
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', mt: 0.5 }}>
          כל הפונקציות זמינות בגרסה זו
        </Typography>
      </Box>
    </Box>
  );
};