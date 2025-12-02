import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Avatar,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { Project } from '../api/client';

interface MobileProjectsTableProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: number) => void;
}

export const MobileProjectsTable: React.FC<MobileProjectsTableProps> = ({
  projects,
  onProjectClick,
  onEditProject,
  onDeleteProject
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (!isMobile) {
    // Desktop table with horizontal scroll
    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 600,
          '& .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            minWidth: 120
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>לקוח</TableCell>
              <TableCell>פרויקט</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>מחיר</TableCell>
              <TableCell>טלפון</TableCell>
              <TableCell>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id} hover>
                <TableCell>{project.clientName}</TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>{project.location}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(project.status)} 
                    color={getStatusColor(project.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>₪{project.totalPrice?.toLocaleString()}</TableCell>
                <TableCell>{project.phoneNumber}</TableCell>
                <TableCell>
                  <IconButton onClick={() => onProjectClick?.(project)} size="small">
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Mobile card view
  return (
    <Box>
      {projects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              אין פרויקטים להצגה
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {projects.map((project) => (
            <Card
              key={project.id}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'scale(0.98)',
                  boxShadow: theme.shadows[8]
                }
              }}
              onClick={() => onProjectClick?.(project)}
            >
              <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {getInitials(project.clientName)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {project.clientName}
                      </Typography>
                      <Chip
                        label={getStatusText(project.status)}
                        color={getStatusColor(project.status) as any}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  <IconButton 
                    onClick={(e) => handleMenuClick(e, project)}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                {/* Project Description */}
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

                <Divider sx={{ my: 2 }} />

                {/* Details Row */}
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
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
                        sx={{ color: 'primary.main', p: 0.5 }}
                      >
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`mailto:client@example.com?subject=פרויקט ${project.clientName}`, '_self');
                      }}
                      sx={{ color: 'primary.main', p: 0.5 }}
                    >
                      <EmailIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Location */}
                {project.location && (
                  <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                    <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {project.location}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (selectedProject) onProjectClick?.(selectedProject);
            handleMenuClose();
          }}
        >
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          צפה בפרטים
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedProject) onEditProject?.(selectedProject);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          ערוך
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (selectedProject) onDeleteProject?.(selectedProject.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          מחק
        </MenuItem>
      </Menu>
    </Box>
  );
};

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'success';
    case 'completed': return 'primary';
    case 'on_hold': return 'warning';
    default: return 'default';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'active': return 'פעיל';
    case 'completed': return 'הושלם';
    case 'on_hold': return 'מושהה';
    case 'planning': return 'תכנון';
    default: return status;
  }
}