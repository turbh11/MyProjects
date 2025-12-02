import React from 'react';
import { 
  useMediaQuery, 
  useTheme, 
  Card, 
  CardContent, 
  Typography,
  Box,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import type { Project } from '../api/client';

const MobileCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease',
  '&:active': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

const StatusChip = styled(Chip)(() => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
}));

interface MobileProjectCardProps {
  project: Project;
  onClick?: (project: Project) => void;
}

export const MobileProjectCard: React.FC<MobileProjectCardProps> = ({ 
  project, 
  onClick 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isMobile) {
    return null; // Use regular table view on desktop
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'on_hold': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'פעיל';
      case 'completed': return 'הושלם';
      case 'on_hold': return 'מושהה';
      case 'planning': return 'תכנון';
      default: return status;
    }
  };

  return (
    <MobileCard onClick={() => onClick?.(project)}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Typography variant="h6" component="h3" fontWeight={600} fontSize="1rem">
            {project.clientName}
          </Typography>
          <StatusChip 
            label={getStatusText(project.status)} 
            color={getStatusColor(project.status) as any}
            size="small"
          />
        </Box>

        {/* Description */}
        {project.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            mb={2}
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {project.description}
          </Typography>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Details */}
        <Box>
          {/* Location */}
          {project.location && (
            <Box display="flex" alignItems="center" gap={0.5} mb={1}>
              <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {project.location}
              </Typography>
            </Box>
          )}

          {/* Price and Actions */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={0.5}>
              <AttachMoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2" fontWeight={600} color="success.main">
                ₪{project.totalPrice?.toLocaleString()}
              </Typography>
            </Box>

            <Box display="flex" gap={0.5}>
              {project.phoneNumber && (
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${project.phoneNumber}`, '_self');
                  }}
                  sx={{ color: 'primary.main' }}
                >
                  <PhoneIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:client@example.com?subject=פרויקט ${project.clientName}`, '_self');
                }}
                sx={{ color: 'primary.main' }}
              >
                <EmailIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </MobileCard>
  );
};