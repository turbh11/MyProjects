import React, { useState } from 'react';
import { CssBaseline, Container, Typography, Button, Box, Tabs, Tab } from '@mui/material';

// Simple App component for testing
function SimpleApp() {
  const [tab, setTab] = useState(0);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Typography variant="h4" gutterBottom>
          🎯 מערכת CRM - גרסת בדיקה
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
            <Tab label="לוח פרויקטים" />
            <Tab label="משימות" />
            <Tab label="סקירת נתונים" />
          </Tabs>
        </Box>

        {tab === 0 && (
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6">📋 לוח פרויקטים</Typography>
            <Typography>האפליקציה עובדת תקין!</Typography>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6">✅ משימות</Typography>
            <Typography>כל הטאבים עובדים!</Typography>
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6">📊 סקירת נתונים</Typography>
            <Typography>אין יותר מסך לבן!</Typography>
          </Box>
        )}
      </Container>
    </>
  );
}

export default SimpleApp;