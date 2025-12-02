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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MessageIcon from '@mui/icons-material/Message';
import { apiClient } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface MessageTemplate {
  name: string;
  content: string;
}

export const MessageTemplatesDialog = ({ open, onClose }: Props) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/messaging/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('שגיאה בטעינת תבניות:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      alert('יש למלא שם ותוכן התבנית');
      return;
    }

    try {
      await apiClient.post('/messaging/templates', {
        name: templateName,
        content: templateContent
      });

      await loadTemplates();
      resetForm();
      alert('התבנית נשמרה בהצלחה!');
    } catch (error) {
      console.error('שגיאה בשמירת תבנית:', error);
      alert('שגיאה בשמירת התבנית');
    }
  };

  const deleteTemplate = async (templateName: string) => {
    if (!confirm('האם למחוק את התבנית?')) return;

    try {
      await apiClient.delete(`/messaging/templates/${templateName}`);
      await loadTemplates();
      if (selectedTemplate?.name === templateName) {
        setSelectedTemplate(null);
      }
      alert('התבנית נמחקה בהצלחה!');
    } catch (error) {
      console.error('שגיאה במחיקת תבנית:', error);
      alert('שגיאה במחיקת התבנית');
    }
  };

  const editTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setIsEditing(true);
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateContent('');
    setIsEditing(false);
  };

  const defaultTemplates = [
    {
      name: 'ברכה כללית',
      content: 'שלום {{clientName}}, זה {{engineerName}} המהנדס.\nאני כותב כדי לבדוק איך הולכים הדברים עם הפרויקט.\nבברכה!'
    },
    {
      name: 'תזכורת פגישה',
      content: 'שלום {{clientName}}, זה {{engineerName}}.\nזכרו שיש לנו פגישה מחר בשעה ___.\nנשמח לראותכם!\nבברכה'
    },
    {
      name: 'הודעת סיום',
      content: 'שלום {{clientName}}, זה {{engineerName}}.\nשמח להודיע שהפרויקט הושלם בהצלחה!\nתודה על הביטחון.\nבברכה'
    },
    {
      name: 'בדיקת שביעות רצון',
      content: 'שלום {{clientName}}, זה {{engineerName}}.\nרציתי לבדוק איך אתם מרגישים עם התוצאה?\nכל שאלה או הערה - זמין עבורכם!\nבברכה'
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <MessageIcon sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h6">ניהול תבניות הודעות</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, height: '600px' }}>
          
          {/* רשימת תבניות */}
          <Box sx={{ width: '40%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">תבניות קיימות</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setIsEditing(true)}
              >
                תבנית חדשה
              </Button>
            </Box>

            {loading ? (
              <Typography>טוען תבניות...</Typography>
            ) : (
              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {templates.map((template) => (
                  <Card key={template.name} sx={{ mb: 1 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {template.content.substring(0, 80)}...
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0 }}>
                      <Button size="small" onClick={() => editTemplate(template)}>
                        ערוך
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => deleteTemplate(template.name)}
                      >
                        מחק
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </List>
            )}

            {templates.length === 0 && !loading && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  אין תבניות שמורות. התחל עם התבניות המוכנות למטה:
                </Alert>
                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>תבניות מוכנות:</Typography>
                {defaultTemplates.map((template) => (
                  <Card key={template.name} sx={{ mb: 1 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {template.name}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0 }}>
                      <Button 
                        size="small"
                        onClick={() => {
                          setTemplateName(template.name);
                          setTemplateContent(template.content);
                          setIsEditing(true);
                        }}
                      >
                        השתמש
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* עריכת תבנית */}
          <Box sx={{ width: '60%' }}>
            {isEditing ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {selectedTemplate ? 'ערוך תבנית' : 'תבנית חדשה'}
                </Typography>

                <TextField
                  label="שם התבנית"
                  fullWidth
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="תוכן ההודעה"
                  multiline
                  rows={12}
                  fullWidth
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="כתוב את תבנית ההודעה כאן...
אפשר להשתמש במשתנים:
{{clientName}} - שם הלקוח
{{engineerName}} - שם המהנדס"
                  sx={{ mb: 2 }}
                />

                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    onClick={saveTemplate}
                    disabled={!templateName.trim() || !templateContent.trim()}
                  >
                    שמור תבנית
                  </Button>
                  <Button onClick={resetForm}>
                    ביטול
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <MessageIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="grey.600">
                  בחר תבנית לעריכה או צור תבנית חדשה
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
};