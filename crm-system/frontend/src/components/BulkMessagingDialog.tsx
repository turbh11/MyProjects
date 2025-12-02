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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import { apiClient } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  projects: any[];
}

export const BulkMessagingDialog = ({ open, onClose, projects }: Props) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const response = await apiClient.get('/messaging/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('שגיאה בטעינת תבניות:', error);
    }
  };

  const handleTemplateSelect = (templateContent: string) => {
    setMessage(templateContent);
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAll = () => {
    setSelectedProjects(projects.map(p => p.id));
  };

  const clearAll = () => {
    setSelectedProjects([]);
  };

  const sendBulkMessages = async () => {
    if (!message.trim() || selectedProjects.length === 0) {
      alert('יש למלא הודעה ולבחור לפחות לקוח אחד');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/messaging/whatsapp/bulk', {
        message,
        clientIds: selectedProjects,
        includeAll: false
      });

      setResults(response.data.results || []);
    } catch (error) {
      console.error('שגיאה בשליחת הודעות:', error);
      alert('שגיאה בהכנת ההודעות');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <WhatsAppIcon sx={{ mr: 1, color: '#25D366' }} />
          <Typography variant="h6">שליחת הודעות המוניות בווטסאפ</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {!results.length ? (
          <>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              בחר תבנית הודעה או כתב הודעה מותאמת אישית
            </Typography>

            {/* בחירת תבנית */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>תבנית הודעה</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  const template = templates.find(t => t.name === e.target.value);
                  if (template) handleTemplateSelect(template.content);
                }}
              >
                {templates.map((template) => (
                  <MenuItem key={template.name} value={template.name}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* הודעה */}
            <TextField
              label="תוכן ההודעה"
              multiline
              rows={4}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="שלום {{clientName}}, זה {{engineerName}}..."
              helperText="אפשר להשתמש ב-{{clientName}} ו-{{engineerName}} להתאמה אישית"
              sx={{ mb: 2 }}
            />

            {/* בחירת לקוחות */}
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">בחר לקוחות ({selectedProjects.length} נבחרו)</Typography>
                <Box>
                  <Button size="small" onClick={selectAll}>בחר הכל</Button>
                  <Button size="small" onClick={clearAll}>נקה הכל</Button>
                </Box>
              </Box>
              <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <List dense>
                  {projects.filter(p => p.phoneNumber).map((project) => (
                    <ListItem key={project.id} button onClick={() => toggleProject(project.id)}>
                      <Checkbox
                        checked={selectedProjects.includes(project.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={project.clientName}
                        secondary={`${project.phoneNumber} • ${project.location}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              הוכנו {results.length} הודעות לשליחה! לחץ על הכפתורים כדי לפתוח את הווטסאפ
            </Alert>
            <List>
              {results.map((result, index) => (
                <ListItem key={index} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                  <ListItemText
                    primary={result.clientName}
                    secondary={result.phoneNumber}
                  />
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<WhatsAppIcon />}
                    onClick={() => openWhatsApp(result.whatsappUrl)}
                  >
                    שלח בווטסאפ
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          סגור
        </Button>
        {!results.length && (
          <Button
            onClick={sendBulkMessages}
            variant="contained"
            disabled={loading || !message.trim() || selectedProjects.length === 0}
            startIcon={<SendIcon />}
          >
            {loading ? 'מכין הודעות...' : 'הכן הודעות לשליחה'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};