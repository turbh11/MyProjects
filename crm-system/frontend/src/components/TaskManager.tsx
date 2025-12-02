
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, MenuItem, 
  List, ListItem, ListItemText, Checkbox, IconButton, Chip, Autocomplete 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { getTasks, createTask, toggleTask, deleteTask, getProjects } from '../api/client';
import type{ Project } from '../api/client';

import type{ Task } from '../api/client';

// הוספנו props כדי לקבל את פונקציית הפתיחה מהאבא (App)
interface Props {
  onOpenProject: (project: Project) => void;
}

export const TaskManager = ({ onOpenProject }: Props) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // רשימת פרויקטים לבחירה
  
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const loadData = async () => {
    const [tasksData, projectsData] = await Promise.all([getTasks(), getProjects()]);
    
    // סינון פרויקטים רק לפעילים (לא בארכיון) עבור הבחירה
    setProjects(projectsData.filter(p => !p.isArchived));

    const sorted = tasksData.sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      const priorities: any = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return priorities[a.priority] - priorities[b.priority];
    });
    setTasks(sorted);
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!desc) return;
    await createTask({ 
      description: desc, 
      priority,
      projectId: selectedProjectId || undefined 
    });
    setDesc('');
    setSelectedProjectId(null);
    loadData();
  };

  const handleToggle = async (id: number) => {
    await toggleTask(id);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if(confirm('למחוק משימה זו?')) {
      await deleteTask(id);
      loadData();
    }
  };

  const getColor = (p: string) => {
    if (p === 'High') return '#ffebee';
    if (p === 'Medium') return '#fff3e0';
    return '#f1f8e9';
  };

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', height: '100%', overflow: 'auto' }}>
      
      {/* טופס הוספה */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">הוספת משימה חדשה</Typography>
        <Box display="flex" gap={2} alignItems="flex-start">
          <TextField 
            fullWidth label="מה צריך לעשות?" variant="outlined" size="small"
            value={desc} onChange={(e) => setDesc(e.target.value)} 
            sx={{ bgcolor: 'white' }}
          />
          
          {/* בחירת פרויקט - הוספנו את זה */}
          <TextField
            select
            label="קשר לפרויקט (אופציונלי)"
            size="small"
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
            sx={{ width: 250, bgcolor: 'white' }}
          >
            <MenuItem value=""><em>ללא שיוך</em></MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                #{p.id} {p.clientName}
              </MenuItem>
            ))}
          </TextField>

          <TextField 
            select label="דחיפות" value={priority} size="small"
            onChange={(e) => setPriority(e.target.value)}
            sx={{ width: 150, bgcolor: 'white' }}
          >
            <MenuItem value="High">דחוף מאוד</MenuItem>
            <MenuItem value="Medium">רגיל</MenuItem>
            <MenuItem value="Low">נמוך</MenuItem>
          </TextField>
          <Button variant="contained" onClick={handleAdd}>הוסף</Button>
        </Box>
      </Paper>

      {/* רשימת משימות */}
      <List sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
        {tasks.map((task) => (
          <ListItem 
            key={task.id} 
            divider 
            sx={{ 
              bgcolor: task.isDone ? '#f5f5f5' : getColor(task.priority),
              opacity: task.isDone ? 0.6 : 1
            }}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDelete(task.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <Checkbox checked={task.isDone} onChange={() => handleToggle(task.id)} />
            
            <ListItemText 
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography sx={{ textDecoration: task.isDone ? 'line-through' : 'none', fontWeight: 'bold' }}>
                    {task.description}
                  </Typography>
                  
                  {/* --- כאן הקישור הקליקאבילי --- */}
                  {task.project && (
                    <Chip 
                      icon={<FolderOpenIcon fontSize="small" />}
                      label={`#${task.project.id} ${task.project.clientName}`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                      onClick={() => onOpenProject(task.project!)} // לחיצה פותחת את הפרויקט
                      sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    />
                  )}
                </Box>
              } 
            />
            
            <Chip 
              label={task.priority === 'High' ? 'דחוף' : task.priority === 'Medium' ? 'רגיל' : 'נמוך'} 
              color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'success'}
              size="small" 
              sx={{ mr: 2 }}
            />
          </ListItem>
        ))}
        {tasks.length === 0 && <Typography p={3} align="center">אין משימות פתוחות 🎉</Typography>}
      </List>
    </Box>
  );
};