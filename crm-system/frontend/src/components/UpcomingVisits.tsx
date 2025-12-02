import React, { useEffect, useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Button, Divider, Box, IconButton, Tooltip } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import { getUpcomingVisits } from '../api/client';

export const UpcomingVisits = () => {
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    getUpcomingVisits().then(setVisits).catch(console.error);
    
    // רענון כל 30 שניות למקרה שנוסף משהו
    const interval = setInterval(() => {
      getUpcomingVisits().then(setVisits).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToGoogleCalendar = (visit: any) => {
    const title = `ביקור: ${visit.project.clientName}`;
    const details = `משימות: ${visit.description}\nמיקום: ${visit.project.location}\nטלפון: ${visit.project.phoneNumber || ''}`;
    
    // המרת התאריך לפורמט של גוגל (YYYYMMDD)
    const dateObj = new Date(visit.visitDate);
    const start = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
    // הוספת שעה אחת לסיום (סתם ברירת מחדל)
    const endObj = new Date(dateObj.getTime() + 60 * 60 * 1000); 
    const end = endObj.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${start}/${end}`;
    
    window.open(url, '_blank');
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        height: '100%', 
        bgcolor: 'white', 
        borderRight: '1px solid #e0e0e0',
        minHeight: '80vh'
      }}
    >
      <Box display="flex" alignItems="center" mb={2} color="primary.main">
        <EventIcon sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight="bold">
          ביקורים קרובים
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      <List sx={{ p: 0 }}>
        {visits.map((v) => (
          <ListItem 
            key={v.id} 
            sx={{ 
              mb: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 2, 
              flexDirection: 'column', 
              alignItems: 'flex-start' 
            }}
          >
             <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-start">
               <ListItemText 
                 primary={
                    <Typography fontWeight="bold" variant="subtitle2">
                        {v.project.clientName}
                    </Typography>
                 }
                 secondary={new Date(v.visitDate).toLocaleDateString('he-IL')}
               />
               <Tooltip title="הוסף ליומן גוגל">
                 <IconButton size="small" onClick={() => addToGoogleCalendar(v)} color="primary">
                   <CalendarTodayIcon fontSize="small" />
                 </IconButton>
               </Tooltip>
             </Box>
             
             <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.85rem' }}>
               {v.description}
             </Typography>
          </ListItem>
        ))}
        
        {visits.length === 0 && (
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 4 }}>
            אין ביקורים מתוכננים לימים הקרובים.
          </Typography>
        )}
      </List>
    </Paper>
  );
};