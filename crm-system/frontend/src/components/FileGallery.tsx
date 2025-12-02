import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, ImageList, ImageListItem, ImageListItemBar, IconButton, Tooltip, Checkbox, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download'; 
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; 
import FolderZipIcon from '@mui/icons-material/FolderZip';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { getAttachments, uploadAttachment, deleteAttachment, DOWNLOAD_ZIP_URL, deleteMultipleAttachments, createFolder } from '../api/client';
import type{ Attachment } from '../api/client';

interface Props {
  projectId: number;
}

export const FileGallery = ({ projectId }: Props) => {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{id: number | null, name: string}>>([{id: null, name: 'בית'}]);

  const loadFiles = async () => {
    try {
      // טעינת קבצים ותיקיות לתיקייה הנוכחית
      const response = await fetch(`/api/attachments/project/${projectId}?folderId=${currentFolderId || ''}`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('שגיאה בטעינת קבצים:', error);
      // fallback לשיטה הישנה
      const data = await getAttachments(projectId);
      setFiles(data);
    }
  };

  useEffect(() => { loadFiles(); }, [projectId, currentFolderId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // שליחת הקובץ עם פרטי התיקייה הנוכחית
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('projectId', projectId.toString());
        if (currentFolderId) {
          formData.append('folderId', currentFolderId.toString());
        }
        
        console.log('שליחת קובץ:', {
          fileName: e.target.files[0].name,
          projectId: projectId.toString(),
          currentFolderId: currentFolderId?.toString()
        });
        
        // בדיקת הנתונים ב-FormData
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
        
        const response = await fetch('/api/attachments', {
          method: 'POST',
          body: formData
        });
        
        console.log('תגובת שרת:', response.status, response.statusText);
        
        if (response.ok) {
          const result = await response.json();
          console.log('העלאה הצליחה!', result);
          loadFiles();
          // איפוס input להעלאה נוספת
          e.target.value = '';
        } else {
          const errorText = await response.text();
          console.error('שגיאת שרת:', response.status, errorText);
          alert(`שגיאה בהעלאת הקובץ: ${errorText}`);
        }
      } catch (error) {
        console.error('שגיאה בהעלאה:', error);
        alert('שגיאה בהעלאת הקובץ');
      }
      
      // איפוס input גם במקרה של שגיאה
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('האם למחוק קובץ זה?')) {
      await deleteAttachment(id);
      loadFiles();
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תיקיה זו? כל הקבצים והתיקיות בתוכה יימחקו!')) {
      try {
        console.log('🗑️ Frontend: מתחיל מחיקת תיקיה:', id);
        const url = `/api/attachments/folder/${id}`;
        console.log('🌐 Frontend: שולח בקשה ל:', url);
        
        const response = await fetch(url, {
          method: 'DELETE'
        });
        
        console.log('📡 Frontend: תגובת שרת:', response.status, response.statusText);
        
        if (response.ok) {
          console.log('✅ Frontend: מחיקה הצליחה, רענון קבצים');
          
          // אם מחקנו את התיקיה הנוכחית, נחזור לתיקיית האב
          if (currentFolderId === id && folderPath.length > 1) {
            console.log('🔄 מחקנו את התיקיה הנוכחית, חוזרים לתיקיית האב');
            navigateBack();
          } else {
            loadFiles();
          }
          
          setSelectedIds(prev => prev.filter(x => x !== id));
          alert('התיקיה נמחקה בהצלחה!');
        } else {
          const errorText = await response.text();
          console.error('❌ Frontend: שגיאה במחיקת התיקיה:', response.status, errorText);
          alert(`שגיאה במחיקת התיקיה: ${errorText}`);
        }
      } catch (error) {
        console.error('💥 Frontend: שגיאת רשת במחיקת התיקיה:', error);
        alert('שגיאה במחיקת התיקיה - בדוק חיבור לאינטרנט');
      }
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // הורדה חכמה - קובץ יחיד ישירות, מספר קבצים כZIP
  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0) return;
    
    // הפרדה בין קבצים ותיקיות
    const selectedFiles = files.filter(f => selectedIds.includes(f.id) && f.type === 'file');
    const selectedFolders = files.filter(f => selectedIds.includes(f.id) && f.type === 'folder');
    
    if (selectedIds.length === 1 && selectedFiles.length === 1) {
      // קובץ יחיד - הורדה ישירה
      const file = selectedFiles[0];
      await downloadSingleFile(file.id, file.originalName);
    } else {
      // מספר פריטים או תיקיות - הורדה כZIP
      const fileIds = selectedFiles.map(f => f.id).join(',');
      const folderIds = selectedFolders.map(f => f.id).join(',');
      
      let url = `${DOWNLOAD_ZIP_URL}?`;
      if (fileIds) url += `ids=${fileIds}&`;
      if (folderIds) url += `folderIds=${folderIds}`;
      
      window.open(url, '_blank');
    }
  };

  // פונקציה מרכזית להורדת קובץ יחיד
  const downloadSingleFile = async (fileId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/attachments/download/${fileId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorText = await response.text();
        console.error('שגיאת שרת:', errorText);
        alert(`שגיאה בהורדת הקובץ: ${errorText}`);
      }
    } catch (error) {
      console.error('שגיאת רשת:', error);
      alert(`שגיאה בהורדת הקובץ`);
    }
  };

  // הורדת קובץ יחיד - עכשיו באמצעות HTML form

  // מחיקת קבצים נבחרים
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`למחוק ${selectedIds.length} קבצים?`)) {
      await deleteMultipleAttachments(selectedIds);
      setSelectedIds([]);
      loadFiles();
    }
  };

  // ניווט לתיקייה
  const navigateToFolder = (folder: any) => {
    if (folder.type === 'folder') {
      setCurrentFolderId(folder.id);
      setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
      setSelectedIds([]);
    }
  };

  // חזרה לתיקיית הורה
  const navigateBack = (targetIndex?: number) => {
    const newPath = targetIndex !== undefined ? folderPath.slice(0, targetIndex + 1) : folderPath.slice(0, -1);
    setFolderPath(newPath);
    const targetFolder = newPath[newPath.length - 1];
    setCurrentFolderId(targetFolder.id);
    setSelectedIds([]);
  };

  // יצירת תיקייה חדשה
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('אנא הכנס שם תיקייה');
      return;
    }
    
    try {
      const response = await fetch(`/api/attachments/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFolderName, 
          projectId: projectId,
          parentId: currentFolderId
        })
      });
      
      if (response.ok) {
        setNewFolderName('');
        setShowNewFolder(false);
        loadFiles(); // רענן את הרשימה
      } else {
        const error = await response.text();
        alert(`שגיאה: ${error}`);
      }
    } catch (error) {
      console.error('שגיאה ביצירת תיקייה:', error);
      alert('שגיאה ביצירת תיקייה');
    }
  };

  // התחלת עריכת שם
  const startEditing = (item: any) => {
    setEditingId(item.id);
    
    // עבור קבצים, הצגת השם בלי הסיומת
    if (item.type === 'file') {
      const lastDotIndex = item.originalName.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > 0 ? 
        item.originalName.substring(0, lastDotIndex) : 
        item.originalName;
      setEditingName(nameWithoutExt);
    } else {
      // עבור תיקיות, הצגת השם המלא
      setEditingName(item.originalName || item.name);
    }
  };

  // שמירת שם חדש
  const saveNewName = async (itemId: number, isFolder: boolean = false) => {
    if (!editingName.trim()) {
      alert('השם לא יכול להיות ריק');
      return;
    }
    
    try {
      let newName = editingName;
      
      // אם זה קובץ, נוסיף את הסיומת המקורית
      if (!isFolder) {
        const item = files.find(f => f.id === itemId);
        if (item && item.originalName) {
          const lastDotIndex = item.originalName.lastIndexOf('.');
          if (lastDotIndex > 0) {
            const extension = item.originalName.substring(lastDotIndex);
            if (!newName.includes('.')) {
              newName = newName + extension;
            }
          }
        }
      }
      
      const endpoint = isFolder ? `/api/attachments/folder/${itemId}/rename` : `/api/attachments/${itemId}/rename`;
      const body = isFolder ? { name: newName } : { originalName: newName };
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        loadFiles(); // רענן את הרשימה
      } else {
        alert('שגיאה בשינוי השם');
      }
    } catch (error) {
      console.error('שגיאה בשינוי השם:', error);
      alert('שגיאה בשינוי השם');
    }
  };

  // ביטול עריכה
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Navigation breadcrumb */}
      <Box display="flex" alignItems="center" mb={2} sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
        {folderPath.map((folder, index) => (
          <Box key={folder.id || 'root'} display="flex" alignItems="center">
            {index > 0 && <Typography sx={{ mx: 1 }}>/</Typography>}
            <Typography 
              variant="body2" 
              sx={{ 
                cursor: index < folderPath.length - 1 ? 'pointer' : 'default',
                color: index < folderPath.length - 1 ? '#1976d2' : 'inherit',
                textDecoration: index < folderPath.length - 1 ? 'underline' : 'none'
              }}
              onClick={() => index < folderPath.length - 1 && navigateBack(index)}
            >
              {folder.name}
            </Typography>
          </Box>
        ))}
      </Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" gap={1} alignItems="center">
            <Typography variant="h6">קבצים</Typography>
            {selectedIds.length > 0 && (
                <>
                  <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={selectedIds.length === 1 ? <DownloadIcon /> : <FolderZipIcon />}
                      onClick={handleDownloadSelected}
                  >
                      {selectedIds.length === 1 ? 'הורד קובץ' : `הורד ${selectedIds.length} כ-ZIP`}
                  </Button>
                  <Button 
                      variant="outlined" 
                      size="small" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSelected}
                  >
                      מחק {selectedIds.length}
                  </Button>
                </>
            )}
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
            העלה קובץ
            <input type="file" hidden onChange={handleUpload} />
          </Button>
          
          {!showNewFolder ? (
            <Button 
              variant="outlined" 
              onClick={() => setShowNewFolder(true)}
              startIcon={<FolderZipIcon />}
            >
              צור תיקייה
            </Button>
          ) : (
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                size="small"
                placeholder="שם תיקייה"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <Button size="small" onClick={handleCreateFolder}>צור</Button>
              <Button size="small" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>בטל</Button>
            </Box>
          )}
        </Box>
      </Box>

      {files.length === 0 && <Typography align="center" sx={{ mt: 4 }}>אין קבצים.</Typography>}

      <ImageList cols={3} gap={16}>
        {files.map((item) => {
          const fileUrl = `http://localhost:3000/uploads/${item.filename}`;
          const isImage = item.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isSelected = selectedIds.includes(item.id);
          const isFolder = item.type === 'folder' || item.filename === 'folder';

          return (
            <ImageListItem key={item.id} sx={{ boxShadow: 2, borderRadius: 1, border: isSelected ? '3px solid #1976d2' : 'none' }}>
              <Box 
                onClick={() => isFolder ? navigateToFolder(item) : undefined}
                sx={{ cursor: isFolder ? 'pointer' : 'default', height: '180px', width: '100%', bgcolor: isFolder ? '#e3f2fd' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                {/* Checkbox צף - רק לקבצים, תיקיות ניתנות לסימון גם */}
                <Checkbox 
                    checked={isSelected} 
                    sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(255,255,255,0.7)' }} 
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(item.id)}
                />
                
                {isFolder ? (
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <FolderIcon sx={{ fontSize: 80, color: '#1976d2' }} />
                    <Typography variant="caption" sx={{ mt: 1 }}>תיקייה</Typography>
                  </Box>
                ) : isImage ? (
                  <img src={fileUrl} alt={item.originalName} loading="lazy" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                ) : (
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <InsertDriveFileIcon sx={{ fontSize: 60, color: '#9e9e9e' }} />
                    <Typography variant="caption" sx={{ mt: 1 }}>{item.filename.split('.').pop()?.toUpperCase()}</Typography>
                  </Box>
                )}
              </Box>
              
              <ImageListItemBar
                title={
                  editingId === item.id ? (
                    <TextField
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      size="small"
                      fullWidth
                      onKeyPress={(e) => e.key === 'Enter' && saveNewName(item.id, item.type === 'folder')}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                  ) : (
                    item.originalName
                  )
                }
                position="bottom"
                actionIcon={
                  <Box>
                    {editingId === item.id ? (
                      <>
                        <Tooltip title="שמור שם">
                          <IconButton 
                            sx={{ color: '#90caf9' }} 
                            onClick={(e) => {
                              e.stopPropagation();
                              saveNewName(item.id, item.type === 'folder');
                            }}
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="בטל">
                          <IconButton 
                            sx={{ color: '#ffcdd2' }} 
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title={item.type === 'folder' ? "בחר תיקיה להורדה" : "הורד קובץ"}>
                          <IconButton 
                            sx={{ color: '#90caf9' }} 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (item.type === 'folder') {
                                alert('להורדת תיקיה, בחר אותה ולחץ על כפתור "הורד נבחרים"');
                              } else {
                                await downloadSingleFile(item.id, item.originalName);
                              }
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ערוך שם">
                          <IconButton 
                            sx={{ color: '#e1bee7' }} 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(item);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={item.type === 'folder' ? "מחק תיקיה" : "מחק קובץ"}>
                          <IconButton 
                            sx={{ color: '#ffcdd2' }} 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.type === 'folder') {
                                handleDeleteFolder(item.id);
                              } else {
                                handleDelete(item.id);
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                }
              />
            </ImageListItem>
          );
        })}
      </ImageList>
    </Box>
  );
};