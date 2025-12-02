import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, TextField, Button, Paper, Divider, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar 
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { getProjectVisits, addVisit } from '../api/client';
import type { Visit } from '../api/client';

interface Props {
  projectId: number;
}

export const VisitLog = ({ projectId }: Props) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [desc, setDesc] = useState('');
  const [actions, setActions] = useState('');
  const [newDate, setNewDate] = useState(''); // State חדש

  const loadVisits = async () => {
    const data = await getProjectVisits(projectId);
    setVisits(data);
  };

  useEffect(() => {
    loadVisits();
  }, [projectId]);

  const handleAdd = async () => {
    if (!desc) return;
    await addVisit({ projectId, description: desc, nextActions: actions, ...(newDate ? { date: newDate } : {} ) });
    setDesc('');
    setActions('');
    setNewDate('');
    loadVisits();
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>יומן עבודה וביקורים</Typography>
      
      {/* טופס הוספה מהיר */}
      <Paper sx={{ p: 2, bgcolor: '#f0f4f8', mb: 3 }}>
        <TextField 
          label="מה בוצע היום?" 
          fullWidth multiline rows={2} 
          value={desc} onChange={(e) => setDesc(e.target.value)} 
          sx={{ mb: 2, bgcolor: 'white' }}
        />
        <TextField 
        type="date" 
        size="small" 
        value={newDate} 
        onChange={(e) => setNewDate(e.target.value)} 
        />
        <TextField 
          label="הערות להמשך (אופציונלי)" 
          fullWidth 
          value={actions} onChange={(e) => setActions(e.target.value)} 
          sx={{ mb: 2, bgcolor: 'white' }}
        />
        <Button variant="contained" onClick={handleAdd}>תיעוד ביקור</Button>
      </Paper>

      {/* רשימת הביקורים */}
      <List>
        {visits.map((visit) => (
          <Paper key={visit.id} elevation={1} sx={{ mb: 2 }}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: '#1976d2' }}>
                  <AssignmentIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {visit.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(visit.visitDate).toLocaleDateString('he-IL')}
                    </Typography>
                  </Box>
                }
                secondary={
                  visit.nextActions && (
                    <Typography component="span" variant="body2" color="error" sx={{ display: 'block', mt: 1 }}>
                      <strong>להמשך טיפול:</strong> {visit.nextActions}
                    </Typography>
                  )
                }
              />
            </ListItem>
          </Paper>
        ))}
        {visits.length === 0 && <Typography>אין תיעודים לפרויקט זה.</Typography>}
      </List>
    </Box>
  );
};