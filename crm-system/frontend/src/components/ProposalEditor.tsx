import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress,
  Alert, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { getProposalContent, updateProposalContent } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: number;
  clientName?: string;
}

export const ProposalEditor = ({ open, onClose, projectId, clientName }: Props) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasProposal, setHasProposal] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      loadProposalContent();
    }
  }, [open, projectId]);

  const loadProposalContent = async () => {
    setLoading(true);
    try {
      const data = await getProposalContent(projectId);
      setContent(data.content || '');
      setHasProposal(data.hasProposal);
    } catch (error) {
      console.error('Error loading proposal:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProposalContent(projectId, content);
      setHasProposal(true);
      alert('✅ הצעת המחיר נשמרה בהצלחה!');
      onClose();
    } catch (error) {
      console.error('Error saving proposal:', error);
      alert('❌ שגיאה בשמירת הצעת המחיר');
    }
    setSaving(false);
  };

  const handleClose = () => {
    if (saving) return; // מונע סגירה בזמן שמירה
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon />
        עריכת הצעת מחיר - {clientName}
        {hasProposal && <Chip label="קיימת" size="small" sx={{ bgcolor: '#4caf50', color: 'white' }} />}
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ m: 2, mb: 1 }}>
              <Typography variant="body2">
                📝 ערוך את הצעת המחיר ישירות כאן - ללא צורך להוריד קבצים!
              </Typography>
            </Alert>
            
            <TextField
              multiline
              fullWidth
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="הכנס או ערוך את תוכן הצעת המחיר כאן..."
              sx={{ 
                flex: 1, 
                '& .MuiInputBase-root': {
                  height: '100%',
                  alignItems: 'flex-start'
                },
                '& .MuiInputBase-input': {
                  height: '100% !important',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  direction: 'rtl'
                },
                m: 2,
                mt: 1
              }}
            />
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1, bgcolor: '#f5f5f5' }}>
        <Button 
          onClick={handleClose} 
          startIcon={<CloseIcon />}
          disabled={saving}
        >
          ביטול
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
          disabled={saving || loading}
        >
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};