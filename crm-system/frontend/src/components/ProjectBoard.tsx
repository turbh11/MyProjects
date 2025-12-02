import React, { useEffect, useState } from 'react';
import { 
  Paper, Typography, Card, CardContent, Chip, Box, CardActionArea, 
  IconButton, Menu, MenuItem, Divider, FormControlLabel, Switch, 
  ListItemIcon, ListItemText, LinearProgress, Tooltip, Checkbox, 
  AppBar, Toolbar, Button, Slide, TextField, InputAdornment,
  useMediaQuery, useTheme
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PhoneIcon from '@mui/icons-material/Phone';
import ArchiveIcon from '@mui/icons-material/Archive';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NavigationIcon from '@mui/icons-material/Navigation';
import { DragDropContext, Draggable } from '@hello-pangea/dnd';
import { StrictModeDroppable } from './StrictModeDroppable'; 
import { CompactProjectCard } from './CompactProjectCard';
import { getProjects, apiClient, generateProposal } from '../api/client';
import { ProjectDetailsDialog } from './ProjectDetailsDialog';
import { ProposalEditor } from './ProposalEditor';
import { MobileProjectsTable } from './MobileProjectsTable';
import type{DropResult } from '@hello-pangea/dnd';
import type{ Project } from '../api/client';

const safeDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('he-IL');
  } catch (e) { return '-'; }
};
const safeNumber = (num: any) => {
  const n = Number(num);
  return isNaN(n) ? 0 : n;
};

export const ProjectBoard = ({ onOpenProject }: { onOpenProject: (p: Project) => void }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProjectId, setMenuProjectId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // --- State לחיפוש ---
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- State להצגה מקטנה ---
  const [compactView, setCompactView] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // --- State לעורך הצעות מחיר ---
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);


  const refreshProjects = () => {
    getProjects().then((data) => {
      if (Array.isArray(data)) setProjects(data);
      else setProjects([]);
    }).catch((error) => {
      console.error('Failed to load projects:', error);
      setProjects([]);
    });
  };

  useEffect(() => { refreshProjects(); }, []);

  // --- סינון חכם ---
  const getFilteredProjects = () => {
    if (!searchQuery) return projects;
    const lowerQuery = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.clientName.toLowerCase().includes(lowerQuery) ||
      (p.location && p.location.toLowerCase().includes(lowerQuery)) ||
      (p.phoneNumber && p.phoneNumber.includes(lowerQuery)) ||
      (p.street && p.street.includes(lowerQuery))
    );
  };

  // משתמשים ברשימה המסוננת במקום ברשימה המלאה
  const filteredProjectsList = getFilteredProjects();

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    handleStatusChange(+draggableId, destination.droppableId);
  };

  const handleStatusChange = async (projectId: number, newStatus: string) => {
    const project = projects.find(p => p.id === projectId);
    
    try {
      let updatedPrice = project?.totalPrice;
      
      if (newStatus === 'Proposal Sent' && project && safeNumber(project.totalPrice) === 0) {
        const priceStr = prompt("הכנס את סכום הצעת המחיר:");
        if (priceStr && !isNaN(parseFloat(priceStr))) {
          updatedPrice = parseFloat(priceStr);
          // עדכון גם המחיר וגם הסטטוס
          await apiClient.patch(`/projects/${projectId}`, { 
            totalPrice: updatedPrice, 
            status: newStatus 
          });
        } else {
          return; // המשתמש ביטל או הכניס ערך לא תקין
        }
      } else {
        // עדכון סטטוס רגיל
        await apiClient.patch(`/projects/${projectId}/status`, { status: newStatus });
      }
      
      // עדכון מיידי של הUI
      const updatedProjects = projects.map(p => 
        p.id === projectId 
          ? { ...p, status: newStatus as any, totalPrice: updatedPrice || p.totalPrice }
          : p
      );
      setProjects(updatedProjects);
      
      // רענון נתונים מהשרת
      setTimeout(refreshProjects, 100);
      
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuProjectId(id);
  };
  const handleMenuClose = () => { setAnchorEl(null); setMenuProjectId(null); };
  const handleMoveTo = (newStatus: string) => { if (menuProjectId) handleStatusChange(menuProjectId, newStatus); handleMenuClose(); };
  
  const handleGenerateProposal = async () => {
    if (!menuProjectId) return;
    
    try {
      const updatedProject = await generateProposal(menuProjectId);
      // עדכון הפרויקט ברשימה
      setProjects(prev => prev.map(p => 
        p.id === menuProjectId ? { ...p, proposalText: updatedProject.proposalText } : p
      ));
      
      alert('✅ הצעת מחיר נוצרה בהצלחה! הקבצים נשמרו בגלריה.');
    } catch (error) {
      console.error('Error generating proposal:', error);
      alert('❌ שגיאה ביצירת הצעת מחיר');
    }
    handleMenuClose();
  };

  const handleEditProposal = () => {
    if (!menuProjectId) return;
    setEditingProjectId(menuProjectId);
    setEditorOpen(true);
    handleMenuClose();
  };
  
  const handleBulkAction = async (action: 'archive' | 'delete' | 'move', payload?: string) => {
    if (selectedIds.length === 0) return;
    try {
      if (action === 'delete') {
        if (!confirm(`למחוק ${selectedIds.length} פרויקטים?`)) return;
        await Promise.all(selectedIds.map(id => apiClient.delete(`/projects/${id}`)));
      } else if (action === 'archive') {
         await Promise.all(selectedIds.map(id => apiClient.patch(`/projects/${id}/archive`)));
      } else if (action === 'move' && payload) {
         await Promise.all(selectedIds.map(id => apiClient.patch(`/projects/${id}/status`, { status: payload })));
      }
      setSelectedIds([]);
      refreshProjects();
    } catch (e) {}
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleColumnSelect = (statusKey: string, currentIdsInColumn: number[]) => {
    const allSelected = currentIdsInColumn.every(id => selectedIds.includes(id));
    if (allSelected) setSelectedIds(prev => prev.filter(id => !currentIdsInColumn.includes(id)));
    else setSelectedIds([...new Set([...selectedIds, ...currentIdsInColumn])]);
  };

  const isStale = (dateString: string) => {
    if (!dateString) return false;
    try {
      const lastUpdate = new Date(dateString);
      const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)); 
      return diffDays > 30;
    } catch { return false; }
  };

  // פונקציות כפתורי הפעולה המהירה
  const handleCallClient = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      alert('אין מספר טלפון לפרויקט זה');
    }
  };

  const handleWhatsApp = (phone: string, clientName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      const cleanPhone = phone.replace(/[^\d]/g, ''); // הסרת תווים לא רלוונטיים
      const message = encodeURIComponent(`שלום ${clientName}, זה מוטי מנחם המהנדס. איך אתה?`);
      window.open(`https://wa.me/972${cleanPhone.substring(1)}?text=${message}`, '_blank');
    } else {
      alert('אין מספר טלפון לפרויקט זה');
    }
  };

  const handleWaze = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const address = `${project.street || ''} ${project.buildingNumber || ''} ${project.location}`.trim();
    if (address) {
      window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, '_blank');
    } else {
      alert('אין כתובת מלאה לפרויקט זה');
    }
  };

  const menuProject = projects.find(p => p.id === menuProjectId);

  const renderColumn = (title: string, statusKey: string, color: string, bgColor: string) => {
    // סינון: גם לפי הסטטוס והארכיון, וגם לפי החיפוש
    const columnProjects = filteredProjectsList.filter(p => p.status === statusKey && p.isArchived === showArchived);
    const columnIds = columnProjects.map(p => p.id);
    
    const selectedCountInColumn = columnIds.filter(id => selectedIds.includes(id)).length;
    const isAllSelected = columnIds.length > 0 && selectedCountInColumn === columnIds.length;
    const isIndeterminate = selectedCountInColumn > 0 && selectedCountInColumn < columnIds.length;

    return (
      <Box sx={{ flex: '1 1 25%', minWidth: '300px', height: '100%' }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, height: '100%', minHeight: '80vh', 
            backgroundColor: showArchived ? '#eaeaea' : bgColor,
            display: 'flex', flexDirection: 'column',
            borderTop: `4px solid ${color}`,
            opacity: showArchived ? 0.8 : 1
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
                <Checkbox 
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={() => handleColumnSelect(statusKey, columnIds)}
                  disabled={columnIds.length === 0}
                  size="small"
                  color="primary"
                  sx={{ p: 0.5, mr: 1 }}
                />
                <Typography variant="subtitle1" sx={{ color: '#333', fontWeight: 'bold' }}>
                  {title}
                </Typography>
            </Box>
            <span style={{color: '#888', fontSize: '0.8em'}}>({columnProjects.length})</span>
          </Box>
          
          <StrictModeDroppable droppableId={statusKey}>
            {(provided) => (
              <Box 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                sx={{ flexGrow: 1, minHeight: 100, overflowY: 'auto' }}
              >
                {columnProjects.map((project, index) => {
                    const tPrice = safeNumber(project.totalPrice);
                    const tPaid = safeNumber(project.totalPaid);
                    const percent = tPrice > 0 ? Math.min((tPaid / tPrice) * 100, 100) : 0;
                    const stale = isStale(project.updatedAt);
                    const isSelected = selectedIds.includes(project.id);

                    return (
                      <Draggable key={project.id} draggableId={project.id.toString()} index={index}>
                        {(provided, snapshot) => 
                          compactView ? (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              sx={{ mb: 1 }}
                            >
                              <CompactProjectCard
                                project={project}
                                onOpenProject={onOpenProject}
                                onCall={handleCallClient}
                                onWhatsApp={handleWhatsApp}
                                onWaze={handleWaze}
                                isExpanded={expandedCards.has(project.id)}
                                onToggleExpand={() => {
                                  const newExpanded = new Set(expandedCards);
                                  if (newExpanded.has(project.id)) {
                                    newExpanded.delete(project.id);
                                  } else {
                                    newExpanded.add(project.id);
                                  }
                                  setExpandedCards(newExpanded);
                                }}
                              />
                            </Box>
                          ) : (
                          <Card 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                            sx={{ 
                              mb: 2, position: 'relative', boxShadow: snapshot.isDragging ? 5 : 1,
                              border: isSelected ? '2px solid #1976d2' : (stale && !showArchived ? '1px solid #ff9800' : 'none'),
                              opacity: showArchived || snapshot.isDragging ? 0.7 : 1,
                              bgcolor: isSelected ? '#e3f2fd' : 'background.paper'
                            }}
                          >
                            <CardActionArea onClick={() => onOpenProject(project)}>
                              <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                  <Box display="flex" alignItems="center">
                                    <Checkbox checked={isSelected} onClick={(e) => { e.stopPropagation(); toggleSelection(project.id); }} size="small" sx={{ ml: -1, mr: 0.5, p: 0.5 }} />
                                    {stale && !showArchived && <Tooltip title="לא עודכן חודש"><WarningAmberIcon sx={{ color: '#ff9800', mr: 1, fontSize: 20 }} /></Tooltip>}
                                    <Typography variant="subtitle2" fontWeight="bold" lineHeight={1.2}>{project?.clientName || 'ללא שם'}</Typography>
                                  </Box>
                                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, project.id)} sx={{ mt: -0.5, mr: -1 }}><MoreVertIcon fontSize="small" /></IconButton>
                                </Box>

                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                                  {project.street ? `${project.street} ${project.buildingNumber || ''}, ` : ''} 
                                  {project.location || ''} | {project.district || ''}
                                  {project.phoneNumber && ` | ${project.phoneNumber}`}
                                </Typography>

                                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                                <Box mb={1}>
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                    <Typography variant="caption" fontWeight="bold">שולם:</Typography>
                                    <Typography variant="caption" fontWeight="bold">₪{tPaid.toLocaleString()} / ₪{tPrice.toLocaleString()}</Typography>
                                  </Box>
                                  <LinearProgress variant="determinate" value={percent} sx={{ height: 6, borderRadius: 3 }} />
                                </Box>

                                <Box display="flex" justifyContent="space-between" mt={1.5} color="text.secondary">
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                     <CalendarTodayIcon sx={{ fontSize: 12 }} />
                                     <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{safeDate(project.createdAt)}</Typography>
                                  </Box>
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                     <AccessTimeIcon sx={{ fontSize: 12 }} />
                                     <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{safeDate(project.updatedAt)}</Typography>
                                  </Box>
                                </Box>

                                {/* כפתורי פעולה מהירה */}
                                <Divider sx={{ my: 1 }} />
                                <Box display="flex" justifyContent="center" gap={1}>
                                  <Tooltip title="חייג ללקוח">
                                    <IconButton 
                                      size="small" 
                                      color="primary" 
                                      onClick={(e) => handleCallClient(project.phoneNumber || '', e)}
                                      sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                                    >
                                      <PhoneIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="שלח וואטסאפ">
                                    <IconButton 
                                      size="small" 
                                      color="success" 
                                      onClick={(e) => handleWhatsApp(project.phoneNumber || '', project.clientName, e)}
                                      sx={{ bgcolor: '#e8f5e8', '&:hover': { bgcolor: '#c8e6c9' } }}
                                    >
                                      <WhatsAppIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="נווט ב-Waze">
                                    <IconButton 
                                      size="small" 
                                      color="warning" 
                                      onClick={(e) => handleWaze(project, e)}
                                      sx={{ bgcolor: '#fff3e0', '&:hover': { bgcolor: '#ffe0b2' } }}
                                    >
                                      <NavigationIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                          )
                        }
                      </Draggable>
                    );
                  })}
                {provided.placeholder}
              </Box>
            )}
          </StrictModeDroppable>
        </Paper>
      </Box>
    );
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // If mobile, show simple project list
  if (isMobile) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#1976d2' }}>
          📊 פרויקטים ({filteredProjects.length})
        </Typography>
        {filteredProjects.length === 0 ? (
          <Typography variant="body1">אין פרויקטים להצגה</Typography>
        ) : (
          <Typography variant="body1" sx={{ color: '#4caf50' }}>
            נמצאו {filteredProjects.length} פרויקטים במערכת
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" gap={2}>
            <FormControlLabel control={<Switch checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} color="warning" />} label={<Box display="flex" alignItems="center" gap={1} color={showArchived ? "warning.main" : "text.secondary"}><ArchiveIcon /><Typography fontWeight="bold">{showArchived ? "מציג ארכיון" : "הצג ארכיון"}</Typography></Box>} />
            <FormControlLabel control={<Switch checked={compactView} onChange={(e) => setCompactView(e.target.checked)} color="primary" />} label={<Box display="flex" alignItems="center" gap={1} color={compactView ? "primary.main" : "text.secondary"}><Typography fontWeight="bold">{compactView ? "תצוגה מקוטנת" : "תצוגה רגילה"}</Typography></Box>} />
        </Box>
        
        {/* --- תיבת חיפוש חכמה --- */}
        <TextField 
            placeholder="חפש לקוח, עיר או טלפון..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ bgcolor: 'white', minWidth: 300 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
            }}
        />
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'stretch', overflowX: 'auto' }}>
          {renderColumn('טרם הוחל', 'Pre-Work', '#757575', '#f5f5f5')}
          {renderColumn('נשלחה הצעת מחיר', 'Proposal Sent', '#0288d1', '#e1f5fe')}
          {renderColumn('בתהליך עבודה', 'In-Progress', '#f57c00', '#fff3e0')}
          {renderColumn('הסתיים', 'Done', '#388e3c', '#e8f5e9')}
        </Box>
      </DragDropContext>

      <Slide direction="up" in={selectedIds.length > 0} mountOnEnter unmountOnExit>
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0, padding: 1 }}>
          <Toolbar sx={{ justifyContent: 'center', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ mr: 4 }}>נבחרו {selectedIds.length}:</Typography>
            <Button 
              variant="contained" 
              sx={{ bgcolor: '#0288d1', '&:hover': { bgcolor: '#0277bd' } }}
              onClick={() => handleBulkAction('move', 'Proposal Sent')}
            >
              נשלחה הצעת מחיר
            </Button>
            <Button 
              variant="contained" 
              sx={{ bgcolor: '#f57c00', '&:hover': { bgcolor: '#ef6c00' } }}
              onClick={() => handleBulkAction('move', 'In-Progress')}
            >
              בתהליך עבודה
            </Button>
            <Button 
              variant="contained" 
              sx={{ bgcolor: '#388e3c', '&:hover': { bgcolor: '#2e7d32' } }}
              onClick={() => handleBulkAction('move', 'Done')}
            >
              הסתיים
            </Button>
            <Box sx={{ flexGrow: 0.1 }} />
            <Button variant="outlined" color="inherit" onClick={() => handleBulkAction('archive')}>{showArchived ? 'שחזר' : 'לארכיון'}</Button>
            <Button variant="outlined" color="error" onClick={() => handleBulkAction('delete')} sx={{ bgcolor: 'white' }}>מחק</Button>
            <IconButton color="inherit" onClick={() => setSelectedIds([])} sx={{ position: 'absolute', left: 10 }}><CloseIcon /></IconButton>
          </Toolbar>
        </AppBar>
      </Slide>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleMoveTo('Pre-Work')}>ל"טרם הוחל"</MenuItem>
          <MenuItem onClick={() => handleMoveTo('Proposal Sent')}>ל"נשלחה הצעת מחיר"</MenuItem>
          <MenuItem onClick={() => handleMoveTo('In-Progress')}>ל"בתהליך עבודה"</MenuItem>
          <MenuItem onClick={() => handleMoveTo('Done')}>ל"הסתיים"</MenuItem>
          <Divider />
          <MenuItem onClick={handleGenerateProposal} sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            📄 צור הצעת מחיר מקצועית
          </MenuItem>
          <MenuItem onClick={handleEditProposal} sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
            ✏️ ערוך הצעת מחיר (מובנה)
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleBulkAction('archive')}>{showArchived ? 'שחזר' : 'לארכיון'}</MenuItem>
          <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'red' }}>מחק</MenuItem>
      </Menu>

      {/* עורך הצעות מחיר מובנה */}
      <ProposalEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingProjectId(null);
        }}
        projectId={editingProjectId || 0}
        clientName={editingProjectId ? projects.find(p => p.id === editingProjectId)?.clientName : ''}
      />
    </>
  );
};