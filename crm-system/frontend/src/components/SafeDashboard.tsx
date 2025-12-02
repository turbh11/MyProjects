import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { Dashboard } from './Dashboard';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3}>
          <Alert severity="error" sx={{ mb: 2 }}>
            שגיאה בטעינת סקירת הנתונים
          </Alert>
          <Typography variant="h6" gutterBottom>
            סקירת נתונים - גרסה מפושטת
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 2,
            mt: 2 
          }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 1,
              boxShadow: 1
            }}>
              <Typography variant="h6">📊 נתונים כלליים</Typography>
              <Typography>אנא רענן את העמוד</Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    return <Dashboard />;
  }
}

export const SafeDashboard = () => {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
};