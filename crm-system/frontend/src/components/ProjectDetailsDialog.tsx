import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, Typography, IconButton, Box, Tabs, Tab, Grid, Divider,
  TextField, MenuItem, Button, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // אייקון של AI
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { updateProject, generateProposal } from '../api/client'; // פונקציות API
import type { Project } from '../api/client'; // פונקציות API

import { PaymentWidget } from './PaymentWidget';
import { VisitLog } from './VisitLog';
import { FileGallery } from './FileGallery';
import { ExpenseWidget } from './ExpenseWidget';
import { SignatureDialog } from './SignatureDialog';
import { ReceiptDialog } from './ReceiptDialog';
import { ContractDialog } from './ContractDialog';

interface Props {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  onProjectUpdated?: () => void;
}

export const ProjectDetailsDialog = ({ project, open, onClose, onProjectUpdated }: Props) => {
  const [tab, setTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // אינדיקטור לטעינה של ה-AI
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [projectPayments, setProjectPayments] = useState<any[]>([]);
  
  // State עבור הטופס
  const [formData, setFormData] = useState<Partial<Project>>({});

  // אתחול הטופס כשנפתח פרויקט חדש
  useEffect(() => {
    if (project) {
      // טעינת תשלומים לצורך הקבלה
      loadProjectPayments();
      
      setFormData({
        clientName: project.clientName,
        description: project.description,
        location: project.location,
        street: project.street || '',
        buildingNumber: project.buildingNumber || '',
        district: project.district,
        totalPrice: project.totalPrice,
        vatPercentage: project.vatPercentage || 17,
        phoneNumber: project.phoneNumber || '',
        proposalText: project.proposalText || '', // הוספנו את שדה ההצעה
      });
      setIsEditing(false); 
    }
  }, [project]);

  if (!project) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- הפונקציה החדשה של ה-AI ---
  const handleGenerateAI = async () => {
    if (!project) return;
    setIsGenerating(true); // מפעיל טעינה
    try {
        // 1. שומרים קודם את המחיר והפרטים כדי שה-AI ידע על מה לעבוד
        await updateProject(project.id, formData); 
        
        // 2. קריאה לשרת לייצור ההצעה
        const updatedProject = await generateProposal(project.id);
        
        // 3. עדכון הטופס עם הטקסט החדש
        setFormData(prev => ({ ...prev, proposalText: updatedProject.proposalText }));
    } catch (error) {
        alert('שגיאה ביצירת הצעת מחיר');
    } finally {
        setIsGenerating(false); // מכבה טעינה
    }
  };

  // פונקציה לשליחת הצעת מחיר בווטסאפ
  const handleSendProposalWhatsApp = () => {
    if (!project.proposalText || !project.phoneNumber) {
      alert('חסרה הצעת מחיר או מספר טלפון');
      return;
    }
    
    const cleanPhone = project.phoneNumber.replace(/[^\d]/g, ''); // הסרת תווים לא רלוונטיים
    const message = `שלום ${project.clientName},\n\nאני שולח לך את הצעת המחיר שלנו:\n\n${project.proposalText}`;
    
    // פתיחת ווטסאפ עם ההודעה
    const whatsappUrl = `https://wa.me/972${cleanPhone.substring(1)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  // ------------------------------

  const loadProjectPayments = async () => {
    try {
      const response = await fetch(`/api/payments/project/${project?.id}`);
      if (response.ok) {
        const payments = await response.json();
        setProjectPayments(payments);
      } else {
        setProjectPayments([]);
      }
    } catch (error) {
      console.error('שגיאה בטעינת תשלומים:', error);
      setProjectPayments([]);
    }
  };

  const handleSave = async () => {
    try {
      await updateProject(project.id, formData);
      setIsEditing(false);
      window.location.reload(); 
    } catch (e) {
      alert('שגיאה בשמירת השינויים');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          
          <Box display="flex" alignItems="center" gap={1} width="100%">
             {isEditing ? (
               <TextField 
                 name="clientName" 
                 value={formData.clientName} 
                 onChange={handleChange} 
                 variant="standard"
                 fullWidth
                 placeholder="שם הלקוח"
               />
             ) : (
               <Typography variant="h5">
                 <Box component="span" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.8em' }}>
                     #{project.id}
                 </Box>
                 {project.clientName}
               </Typography>
             )}
          </Box>
          
          <Box display="flex">
             {isEditing ? (
               <>
                 <IconButton onClick={handleSave} color="primary" title="שמור"><SaveIcon /></IconButton>
                 <IconButton onClick={() => setIsEditing(false)} color="error" title="ביטול"><CancelIcon /></IconButton>
               </>
             ) : (
               <IconButton onClick={() => setIsEditing(true)} title="ערוך פרטים"><EditIcon /></IconButton>
             )}
             <IconButton onClick={onClose}><CloseIcon /></IconButton>
          </Box>

        </Box>
        
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="פרטים ותשלומים" />
          <Tab label="הוצאות" />
          <Tab label="יומן ביקורים" />
          <Tab label="קבצים" />
        </Tabs>
      </DialogTitle>
      
      <DialogContent dividers>
        
        {/* טאב 0: פרטים + תשלומים */}
        {tab === 0 && (
          <Grid container spacing={3}>
            
            {/* צד ימין: פרטי הלקוח (עריכה או תצוגה) */}
            <Grid item xs={12} md={7}>
              
              {isEditing ? (
                // --- מצב עריכה ---
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="תיאור" name="description" multiline rows={3} value={formData.description} onChange={handleChange} />
                  </Grid>
                  
                  {/* --- כאן הוספנו את ה-AI --- */}
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} mt={1}>
                        <Typography variant="subtitle2" fontWeight="bold">הצעת מחיר (AI)</Typography>
                        <Button 
                        variant="outlined" 
                        color="secondary" 
                        startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />} 
                        onClick={handleGenerateAI}
                        disabled={isGenerating}
                        size="small"
                        >
                        {isGenerating ? 'מייצר הצעה...' : 'צור הצעה אוטומטית'}
                        </Button>
                    </Box>
                    <TextField 
                        fullWidth 
                        multiline 
                        rows={6} 
                        placeholder="כאן יופיע הטקסט שנוצר..." 
                        name="proposalText" 
                        value={formData.proposalText || ''} 
                        onChange={handleChange} 
                        sx={{ bgcolor: '#f3e5f5' }} // צבע רקע סגלגל עדין
                    />
                  </Grid>
                  {/* --------------------------- */}

                  <Grid item xs={6}>
                    <TextField fullWidth label="טלפון" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      type="number" 
                      label="סכום ללא מעמ (₪)" 
                      name="totalPrice" 
                      value={formData.totalPrice} 
                      onChange={handleChange} 
                      helperText={Number(formData.totalPrice) > 0 ? `מעמ (${Number(formData.vatPercentage || 17)}%): ₪${(Number(formData.totalPrice) * (Number(formData.vatPercentage || 17) / 100)).toLocaleString()} | סה"כ עם מעמ: ₪${(Number(formData.totalPrice) * (1 + Number(formData.vatPercentage || 17) / 100)).toLocaleString()}` : ''}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      type="number" 
                      label="אחוז מעמ (%)" 
                      name="vatPercentage" 
                      value={formData.vatPercentage} 
                      onChange={handleChange} 
                      inputProps={{ min: 0, max: 50, step: 0.1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}><Divider>כתובת</Divider></Grid>
                  
                  <Grid item xs={8}>
                    <TextField fullWidth label="עיר" name="location" value={formData.location} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField fullWidth select label="מחוז" name="district" value={formData.district} onChange={handleChange}>
                      <MenuItem value="גוש עציון">גוש עציון</MenuItem>
                      <MenuItem value="בנימין">בנימין</MenuItem>
                      <MenuItem value="ירושלים">ירושלים</MenuItem>
                      <MenuItem value="מרכז">מרכז</MenuItem>
                      <MenuItem value="דרום">דרום</MenuItem>
                      <MenuItem value="צפון">צפון</MenuItem>
                      <MenuItem value="יהודה">יהודה</MenuItem>
                      <MenuItem value="שומרון">שומרון</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={8}>
                    <TextField fullWidth label="רחוב" name="street" value={formData.street} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField fullWidth label="מס' בית" name="buildingNumber" value={formData.buildingNumber} onChange={handleChange} />
                  </Grid>
                </Grid>
              ) : (
                // --- מצב תצוגה רגיל ---
                <>
                  <Typography variant="subtitle1" fontWeight="bold">תיאור:</Typography>
                  <Typography paragraph>{project.description || 'אין תיאור'}</Typography>
                  
                  {/* הצגת הצעת מחיר אם קיימת */}
                  {project.proposalText && (
                    <Box sx={{ bgcolor: '#f3e5f5', p: 2, borderRadius: 1, mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="secondary">הצעת מחיר שנשלחה:</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{project.proposalText}</Typography>
                    </Box>
                  )}

                  <Typography variant="subtitle2" color="textSecondary">כתובת:</Typography>
                  <Typography gutterBottom>
                    {project.street ? `${project.street} ${project.buildingNumber || ''}, ` : ''} 
                    {project.location} ({project.district})
                  </Typography>

                  {project.phoneNumber && (
                     <>
                       <Typography variant="subtitle2" color="textSecondary">טלפון:</Typography>
                       <Typography gutterBottom>{project.phoneNumber}</Typography>
                     </>
                  )}
                  
                  {/* כפתורים לפעולות על הצעת מחיר */}
                  {project.proposalText && (
                    <Box mt={2} display="flex" flexDirection="column" gap={1}>
                      {/* כפתור שליחה בווטסאפ */}
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={handleSendProposalWhatsApp}
                        startIcon={<WhatsAppIcon />}
                        disabled={!project.phoneNumber}
                      >
                        📱 שלח הצעת מחיר בווטסאפ
                      </Button>
                      
                      {/* כפתור חתימה דיגיטלית */}
                      <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        onClick={() => setIsSignatureOpen(true)}
                        sx={{ borderStyle: 'dashed' }}
                      >
                        ✍️ חתימה דיגיטלית על ההצעה
                      </Button>
                    </Box>
                  )}

                  {/* כפתורי מסמכים מתקדמים */}
                  <Box mt={3} display="flex" flexDirection="column" gap={1}>
                    <Typography variant="subtitle2" color="textSecondary" mb={1}>
                      📄 מסמכים מתקדמים:
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setIsContractOpen(true)}
                      startIcon={<span>📋</span>}
                    >
                      יצירת הסכם אוטומטי
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setIsReceiptOpen(true)}
                      startIcon={<span>🧾</span>}
                    >
                      יצירת קבלה מעוצבת
                    </Button>
                  </Box>
                </>
              )}

            </Grid>
            
            <Grid item xs={12} md={5}>
               <PaymentWidget 
                 projectId={project.id} 
                 totalPrice={Number(isEditing ? formData.totalPrice : project.totalPrice)}
                 vatPercentage={Number(isEditing ? formData.vatPercentage : project.vatPercentage) || 17}
                 onPaymentAdded={onProjectUpdated}
               />
            </Grid>
          </Grid>
        )}

        {tab === 1 && <ExpenseWidget projectId={project.id} />}
        {tab === 2 && <VisitLog projectId={project.id} />}
        {tab === 3 && <FileGallery projectId={project.id} />}
      </DialogContent>

      {/* דיאלוג חתימה דיגיטלית */}
      <SignatureDialog
        open={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        projectId={project.id}
        clientName={project.clientName}
      />

      {/* דיאלוג קבלה מעוצבת */}
      <ReceiptDialog
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        project={project}
        payments={projectPayments}
      />

      {/* דיאלוג הסכם אוטומטי */}
      <ContractDialog
        open={isContractOpen}
        onClose={() => setIsContractOpen(false)}
        project={project}
      />
    </Dialog>
  );
};