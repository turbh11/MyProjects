import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Collapse,
  Divider,
  LinearProgress,
  Tooltip,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NavigationIcon from '@mui/icons-material/Navigation';
import type { Project } from '../api/client';

interface Props {
  project: Project;
  onOpenProject: (project: Project) => void;
  onCall: (phone: string, e: React.MouseEvent) => void;
  onWhatsApp: (phone: string, clientName: string, e: React.MouseEvent) => void;
  onWaze: (project: Project, e: React.MouseEvent) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const CompactProjectCard = ({ 
  project, 
  onOpenProject, 
  onCall, 
  onWhatsApp, 
  onWaze,
  isExpanded = false,
  onToggleExpand
}: Props) => {
  const tPrice = Number(project.totalPrice || 0);
  const vatPercentage = Number(project.vatPercentage || 17);
  const vatAmount = Math.round(tPrice * (vatPercentage / 100) * 100) / 100;
  const totalWithVat = Math.round((tPrice + vatAmount) * 100) / 100;
  const tPaid = Number(project.totalPaid || 0);
  const percent = totalWithVat > 0 ? Math.min((tPaid / totalWithVat) * 100, 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pre-Work': return '#757575';
      case 'Proposal Sent': return '#0288d1';
      case 'In-Progress': return '#f57c00';
      case 'Done': return '#388e3c';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pre-Work': return 'טרם הוחל';
      case 'Proposal Sent': return 'נשלחה הצעה';
      case 'In-Progress': return 'בביצוע';
      case 'Done': return 'הסתיים';
      default: return status;
    }
  };

  return (
    <Card sx={{ mb: 1, cursor: 'pointer' }}>
      {/* תצוגה מקופלת - רק שם ועיר */}
      <CardContent 
        sx={{ py: 1, '&:last-child': { pb: 1 } }}
        onClick={() => onOpenProject(project)}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" flex={1}>
            <Typography variant="body2" fontWeight="bold" sx={{ mr: 1 }}>
              {project.clientName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {project.location}
            </Typography>
            <Chip 
              label={getStatusText(project.status)} 
              size="small" 
              sx={{ 
                ml: 1,
                bgcolor: getStatusColor(project.status),
                color: 'white',
                fontSize: '0.7rem'
              }} 
            />
          </Box>
          
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            sx={{ p: 0.5 }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </CardContent>

      {/* תצוגה מורחבת - כל הפרטים */}
      <Collapse in={isExpanded}>
        <Divider />
        <CardContent sx={{ pt: 1 }}>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
            {project.street ? `${project.street} ${project.buildingNumber || ''}, ` : ''} 
            {project.location || ''} | {project.district || ''}
            {project.phoneNumber && ` | ${project.phoneNumber}`}
          </Typography>

          <Box mb={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" fontWeight="bold">שולם:</Typography>
              <Box textAlign="right">
                <Typography variant="caption" fontWeight="bold">
                  ₪{tPaid.toLocaleString()} / ₪{totalWithVat.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" fontSize="10px">
                  ללא מע"ם: ₪{tPrice.toLocaleString()} | מע"ם ({vatPercentage}%): ₪{vatAmount.toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 4, borderRadius: 2 }} />
          </Box>

          {/* כפתורי פעולה מהירה */}
          <Box display="flex" justifyContent="center" gap={1} mt={1}>
            <Tooltip title="חייג ללקוח">
              <IconButton 
                size="small" 
                onClick={(e) => onCall(project.phoneNumber || '', e)}
                sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
              >
                <PhoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="שלח וואטסאפ">
              <IconButton 
                size="small" 
                onClick={(e) => onWhatsApp(project.phoneNumber || '', project.clientName, e)}
                sx={{ bgcolor: '#e8f5e8', '&:hover': { bgcolor: '#c8e6c9' } }}
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="נווט ב-Waze">
              <IconButton 
                size="small" 
                onClick={(e) => onWaze(project, e)}
                sx={{ bgcolor: '#fff3e0', '&:hover': { bgcolor: '#ffe0b2' } }}
              >
                <NavigationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};