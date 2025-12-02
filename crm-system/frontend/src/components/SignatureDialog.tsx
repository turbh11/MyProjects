import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper
} from '@mui/material';
import { apiClient } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: number;
  clientName: string;
}

export const SignatureDialog = ({ open, onClose, projectId, clientName }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // הגדרת Canvas
    canvas.width = 400;
    canvas.height = 200;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, [open]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // תמיכה במגע (טאבלט/טלפון)
  const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const touchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) {
      alert('נא לחתום לפני השמירה');
      return;
    }

    try {
      // המרת החתימה לתמונה
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('file', blob, `signature-${projectId}-${Date.now()}.png`);
        formData.append('projectId', projectId.toString());

        // שמירה כקובץ רגיל במערכת
        await apiClient.post('/attachments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        alert('החתימה נשמרה בהצלחה!');
        onClose();
      }, 'image/png');
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('שגיאה בשמירת החתימה');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle>
        <Typography variant="h6">חתימה דיגיטלית</Typography>
        <Typography variant="body2" color="textSecondary">
          {clientName} - פרויקט #{projectId}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="body2" color="textSecondary">
            חתום כאן עם העכבר או האצבע (במכשירי מגע):
          </Typography>
          
          <Paper elevation={3} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <canvas
              ref={canvasRef}
              style={{ 
                border: '2px solid #ddd', 
                borderRadius: '4px',
                cursor: 'crosshair',
                backgroundColor: 'white',
                touchAction: 'none' // מונע גלילה בזמן חתימה
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startTouchDrawing}
              onTouchMove={touchDraw}
              onTouchEnd={stopDrawing}
            />
          </Paper>
          
          <Typography variant="caption" color="textSecondary" textAlign="center">
            על ידי החתימה אני מאשר את תנאי ההצעה ונותן אישור להתחלת העבודה
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={clearSignature} disabled={isEmpty}>
          נקה חתימה
        </Button>
        <Button onClick={onClose}>
          ביטול
        </Button>
        <Button onClick={saveSignature} variant="contained" disabled={isEmpty}>
          שמור חתימה
        </Button>
      </DialogActions>
    </Dialog>
  );
};