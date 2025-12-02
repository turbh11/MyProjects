import React, { useState, useEffect } from 'react';
import { CssBaseline, Container, Typography, Button, Box, Tabs, Tab, TextField, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SyncIcon from '@mui/icons-material/Sync';
import BackupIcon from '@mui/icons-material/Backup';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PaymentIcon from '@mui/icons-material/Payment';
import MessageIcon from '@mui/icons-material/Message';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReceiptIcon from '@mui/icons-material/Receipt';

import { SettingsDialog } from './components/SettingsDialog';
import { EngineerSettingsDialog } from './components/EngineerSettingsDialog';
import { BulkMessagingDialog } from './components/BulkMessagingDialog';
import { PaymentRemindersDialog } from './components/PaymentRemindersDialog';
import { MessageTemplatesDialog } from './components/MessageTemplatesDialog';
import { BusinessExpensesDialog } from './components/BusinessExpensesDialog';
import EmailNotificationDialog from './components/EmailNotificationDialog';
import NotificationBell from './components/NotificationBell';
import { VatSettingsDialog } from './components/VatSettingsDialog';
import { ProjectBoard } from './components/ProjectBoard';
import { AddProjectDialog } from './components/AddProjectDialog';
import { TaskManager } from './components/TaskManager';
import { UpcomingVisits } from './components/UpcomingVisits';
import { ProjectDetailsDialog } from './components/ProjectDetailsDialog';
import { DOWNLOAD_CSV_URL, syncFiles, apiClient, createManualBackup } from './api/client';
import type{  Project } from './api/client';
import { Dashboard } from './components/Dashboard';
function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Mobile state hooks - must be declared unconditionally
  const [mobileTab, setMobileTab] = useState(0);
  const [mobileProjects, setMobileProjects] = useState<Project[]>([]);
  const [mobileStats, setMobileStats] = useState({ totalRevenue: 0, activeProjects: 0, pendingTasks: 0, upcomingVisits: 0 });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // If mobile, show functional mobile interface
  if (isMobile) {

    // Load data on mount
    useEffect(() => {
      const loadMobileData = async () => {
        try {
          // Load projects
          const projectsResponse = await fetch('/api/projects');
          const projectsData = await projectsResponse.json();
          console.log('Projects data:', projectsData); // Debug
          // Load tasks
          let pendingTasks = 0;
          try {
            const tasksResponse = await fetch('/api/tasks');
            const tasksData = await tasksResponse.json();
            pendingTasks = Array.isArray(tasksData) ? tasksData.filter(t => t.status !== 'completed').length : 0;
          } catch (e) { console.log('No tasks API'); }

          // Load visits
          let upcomingVisits = 0;
          try {
            const visitsResponse = await fetch('/api/visits/upcoming');
            const visitsData = await visitsResponse.json();
            upcomingVisits = Array.isArray(visitsData) ? visitsData.length : 0;
          } catch (e) { console.log('No visits API'); }

          // Calculate stats from actual data
          const projects = Array.isArray(projectsData) ? projectsData : [];
          
          // Filter out archived projects and get only active ones
          const activeProjectsList = projects.filter((p: any) => !p.isArchived && (p.status !== 'Done' && p.status !== 'Completed'));
          
          // Calculate total revenue from completed projects
          const totalRevenue = projects
            .filter((p: any) => p.status === 'Done' || p.status === 'Completed')
            .reduce((sum: number, p: any) => {
              const price = Number(p.totalPrice) || 0;
              return sum + price;
            }, 0);
          
          const activeProjects = activeProjectsList.length;
          
          setMobileStats({
            totalRevenue,
            activeProjects,
            pendingTasks,
            upcomingVisits
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Error loading mobile data:', error);
          setLoading(false);
        }
      };
      
      loadMobileData();
    }, []);

    // Update project payment
    const updatePayment = async (projectId: string, amount: number) => {
      try {
        const response = await fetch(`/api/projects/${projectId}/payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paidAmount: amount, paymentDate: new Date().toISOString() })
        });
        
        if (response.ok) {
          // Reload projects
          const projectsResponse = await fetch('/api/projects');
          const projectsData = await projectsResponse.json();
          setMobileProjects(projectsData.slice(0, 10));
          alert('תשלום עודכן בהצלחה!');
        }
      } catch (error) {
        alert('שגיאה בעדכון התשלום');
      }
    };

    // Add visit
    const addVisit = async (projectId: string, notes: string) => {
      try {
        const response = await fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            visitDate: new Date().toISOString(),
            notes,
            status: 'completed'
          })
        });
        
        if (response.ok) {
          alert('ביקור נרשם בהצלחה!');
        }
      } catch (error) {
        alert('שגיאה ברישום הביקור');
      }
    };

    if (loading) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          📱 טוען נתוני המערכת...
        </div>
      );
    }
    
    const mobileMenuItems = [
      { icon: '📊', label: 'דשבורד', id: 0 },
      { icon: '📋', label: 'פרויקטים', id: 1 },
      { icon: '📝', label: 'משימות', id: 2 },
      { icon: '📅', label: 'ביקורים', id: 3 },
      { icon: '⚙️', label: 'הגדרות', id: 4 }
    ];

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Arial, sans-serif',
        direction: 'rtl'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255,255,255,0.98)',
          padding: '20px',
          borderBottom: '3px solid #1976d2',
          textAlign: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '2rem', 
            color: '#1976d2',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            🏢 מערכת CRM
          </h1>
          <div style={{ fontSize: '1rem', color: '#666', marginTop: '8px', fontWeight: '500' }}>
            📱 גרסת נייד מתקדמת
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '15px', paddingBottom: '80px' }}>
          {mobileTab === 0 && (
            <div>
              <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px', fontSize: '1.3rem' }}>
                📊 דשבורד ראשי
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>💰</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>הכנסות חודש</div>
                  <div style={{ color: '#4caf50', fontSize: '1rem', fontWeight: 'bold' }}>
                    {mobileStats.totalRevenue > 0 ? `₪${(mobileStats.totalRevenue/1000).toFixed(1)}K` : '₪0'}
                  </div>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>פרויקטים</div>
                  <div style={{ color: '#1976d2', fontSize: '1.4rem', fontWeight: 'bold' }}>{mobileProjects.length}</div>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📝</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>משימות היום</div>
                  <div style={{ color: '#ff9800', fontSize: '1.4rem', fontWeight: 'bold' }}>{mobileStats.pendingTasks}</div>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  minHeight: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📅</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>ביקורים</div>
                  <div style={{ color: '#9c27b0', fontSize: '1.4rem', fontWeight: 'bold' }}>{mobileStats.upcomingVisits}</div>
                </div>
              </div>
            </div>
          )}

          {mobileTab === 1 && (
            <div>
              <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                📋 פרויקטים פעילים ({mobileProjects.length})
              </h2>
              {mobileProjects.length === 0 ? (
                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
                  אין פרויקטים להצגה
                </div>
              ) : (
                mobileProjects.map(project => (
                  <div key={project.id} style={{
                    background: 'white',
                    margin: '10px 0',
                    padding: '15px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px', color: '#1976d2' }}>
                        {project.clientName || `לקוח #${project.id}`}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: '1.4' }}>
                        <div style={{ marginBottom: '4px' }}>
                          📍 <strong>כתובת:</strong> {project.location || 'לא צוין'}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          📞 <strong>טלפון:</strong> {project.phoneNumber || 'לא צוין'}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          💰 <strong>סה"כ:</strong> {project.totalPrice ? `₪${project.totalPrice.toLocaleString()}` : 'לא נקבע'}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          💳 <strong>שולם:</strong> {project.totalPaid ? `₪${project.totalPaid.toLocaleString()}` : '₪0'}
                        </div>
                        {project.totalPrice && (
                          <div style={{ marginBottom: '4px', color: project.totalPaid >= project.totalPrice ? '#4caf50' : '#f57c00' }}>
                            💡 <strong>נותר:</strong> ₪{(project.totalPrice - (project.totalPaid || 0)).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '15px' }}>
                      <span style={{
                        background: project.status === 'In-Progress' ? '#e8f5e8' : '#fff3e0',
                        color: project.status === 'In-Progress' ? '#2e7d32' : '#f57c00',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem'
                      }}>
                        {project.status === 'In-Progress' ? '✅ פעיל' : '⏳ ממתין'}
                      </span>
                      

                    </div>
                    
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          const amount = prompt('הכנס סכום שהתקבל:');
                          if (amount && !isNaN(Number(amount))) {
                            updatePayment(String(project.id), Number(amount));
                          }
                        }}
                        style={{
                          background: '#4caf50',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        💰 קיבלתי כסף
                      </button>
                      
                      <button
                        onClick={() => {
                          const notes = prompt('הערות על הביקור:') || 'ביקור בוצע';
                          addVisit(String(project.id), notes);
                        }}
                        style={{
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        📅 ביקור
                      </button>
                      
                      <button
                        onClick={() => setSelectedProject(project)}
                        style={{
                          background: '#ff9800',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        📷 תמונה
                      </button>
                      
                      <button
                        onClick={() => {
                          if (project.phoneNumber) {
                            window.open(`tel:${project.phoneNumber}`);
                          } else {
                            alert('אין מספר טלפון רשום');
                          }
                        }}
                        style={{
                          background: '#9c27b0',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        📞 חייג
                      </button>
                    </div>
                  </div>
                ))
              )}
              
              {/* Photo upload modal */}
              {selectedProject && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    maxWidth: '300px',
                    width: '90%'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
                      📷 העלה תמונה לפרויקט
                    </h3>
                    <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#666' }}>
                      {selectedProject?.clientName || 'לקוח'}
                    </p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{
                        width: '100%',
                        padding: '10px',
                        marginBottom: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('projectId', String(selectedProject?.id || ''));
                          
                          try {
                            const response = await fetch('/api/attachments/upload', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (response.ok) {
                              alert('תמונה הועלתה בהצלחה!');
                              setSelectedProject(null);
                            } else {
                              alert('שגיאה בהעלאת התמונה');
                            }
                          } catch (error) {
                            alert('שגיאה בהעלאת התמונה');
                          }
                        }
                      }}
                    />
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedProject(null)}
                        style={{
                          flex: 1,
                          background: '#666',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mobileTab === 2 && (
            <div>
              <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px', fontSize: '1.3rem' }}>
                📝 משימות ופעילויות
              </h2>
              
              {/* פרויקטים הדורשים תשומת לב */}
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '10px' }}>🔥 דחופים</h3>
                {mobileProjects.filter(p => p.totalPrice && p.totalPaid < p.totalPrice).slice(0, 3).map(project => (
                  <div key={`urgent-${project.id}`} style={{
                    background: '#ffebee',
                    border: '2px solid #f44336',
                    margin: '8px 0',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      ⚠️ {project.clientName} - חסר תשלום
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      נותר לקבל: ₪{((project.totalPrice || 0) - (project.totalPaid || 0)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* משימות כלליות */}
              <div style={{ background: 'white', borderRadius: '10px', padding: '15px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>✅ משימות היום</h4>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    📞 התקשר ל{mobileProjects.length > 0 ? mobileProjects[0].clientName : 'לקוחות'} - מעקב תשלום
                  </div>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    📋 עדכון מצב פרויקטים פעילים ({mobileProjects.filter(p => p.status === 'In-Progress').length})
                  </div>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    📧 שליחת הצעות מחיר חדשות
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    📅 קביעת ביקורים לשבוע הבא
                  </div>
                </div>
              </div>
            </div>
          )}

          {mobileTab === 3 && (
            <div>
              <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px', fontSize: '1.3rem' }}>
                📅 ביקורים ופגישות
              </h2>
              
              {/* ביקורים מתוכננים */}
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '10px' }}>🕐 השבוע</h3>
                {mobileProjects.slice(0, 3).map((project, index) => {
                  const days = ['מחר', 'יום ג\'', 'יום ד\'', 'יום ה\'', 'יום ו\''];
                  const times = ['09:00', '11:30', '14:00', '16:30'];
                  return (
                    <div key={`visit-${project.id}`} style={{
                      background: 'white',
                      margin: '8px 0',
                      padding: '15px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                          {days[index]} {times[index]}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          #{project.id}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                        👤 <strong>{project.clientName}</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        📍 {project.location || 'כתובת לא צוינה'}
                      </div>
                      {project.phoneNumber && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                          📞 {project.phoneNumber}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* סטטיסטיקת ביקורים */}
              <div style={{ background: 'white', borderRadius: '10px', padding: '15px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>📊 סטטיסטיקות</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                  <div style={{ textAlign: 'center', padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 'bold', color: '#4caf50' }}>השבוע</div>
                    <div>{Math.min(mobileProjects.length, 3)} ביקורים</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '10px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 'bold', color: '#ff9800' }}>החודש</div>
                    <div>{mobileProjects.length * 2} ביקורים</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mobileTab === 4 && (
            <div>
              <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                ⚙️ הגדרות מערכת
              </h2>
              <div style={{ background: 'white', borderRadius: '10px', padding: '20px' }}>
                <button style={{
                  width: '100%',
                  padding: '12px',
                  margin: '5px 0',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }} onClick={() => window.location.reload()}>
                  🔄 רענן מערכת
                </button>
                
                <button style={{
                  width: '100%',
                  padding: '12px',
                  margin: '5px 0',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }} onClick={() => alert('גיבוי הופעל!')}>
                  💾 צור גיבוי
                </button>
                
                <button style={{
                  width: '100%',
                  padding: '12px',
                  margin: '5px 0',
                  background: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }} onClick={() => window.open('http://10.0.0.20', '_blank')}>
                  💻 גרסת מחשב
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          display: 'flex',
          borderTop: '2px solid #e0e0e0',
          padding: '10px 0'
        }}>
          {mobileMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setMobileTab(item.id)}
              style={{
                flex: 1,
                border: 'none',
                background: mobileTab === item.id ? '#e3f2fd' : 'transparent',
                padding: '8px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: mobileTab === item.id ? '#1976d2' : '#666'
              }}
            >
              <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
              <div>{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  const [tab, setTab] = useState(0); 
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEngineerSettingsOpen, setIsEngineerSettingsOpen] = useState(false);
  const [isBulkMessagingOpen, setIsBulkMessagingOpen] = useState(false);
  const [isPaymentRemindersOpen, setIsPaymentRemindersOpen] = useState(false);
  const [isMessageTemplatesOpen, setIsMessageTemplatesOpen] = useState(false);
  const [isBusinessExpensesOpen, setIsBusinessExpensesOpen] = useState(false);
  const [isEmailNotificationOpen, setIsEmailNotificationOpen] = useState(false);
  const [isVatSettingsOpen, setIsVatSettingsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // --- ניהול כותרת ---
  const [appTitle, setAppTitle] = useState('ניהול משרד');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    const savedTitle = localStorage.getItem('appTitle');
    if (savedTitle) setAppTitle(savedTitle);
  }, []);

  const saveTitle = () => {
    localStorage.setItem('appTitle', appTitle);
    setIsEditingTitle(false);
  };

  // --- ניהול כפתור ה-Seed ---
  const [showSeedButton, setShowSeedButton] = useState(() => {
      return localStorage.getItem('showSeedButton') !== 'false';
  });

  const handleToggleSeed = (show: boolean) => {
      setShowSeedButton(show);
      localStorage.setItem('showSeedButton', String(show));
  };

  const handleSeed = async () => {
    if (confirm('האם ליצור נתונים פיקטיביים?')) {
      await apiClient.post('/projects/seed-data');
      window.location.reload(); 
    }
  };

  const handleManualBackup = async () => {
    if (confirm('ליצור גיבוי מלא של המערכת?')) {
      try {
        const result = await createManualBackup();
        alert(`גיבוי נוצר בהצלחה: ${result.fileName}`);
      } catch (error) {
        alert('שגיאה ביצירת הגיבוי');
      }
    }
  };

  // --- State גלובלי לפרויקט שנבחר (using mobile state) ---

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
  };

  // טעינת פרויקטים להודעות המוניות
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await apiClient.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('שגיאה בטעינת פרויקטים:', error);
      }
    };
    loadProjects();
  }, [refreshTrigger]);

  return (
    <>
      <CssBaseline />
      <Container maxWidth={false} sx={{ mt: 2, minHeight: '100vh', height: 'auto', px: 3 }} dir="rtl">
        
        {/* כותרת עליונה */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} pb={1} borderBottom={1} borderColor="divider">
          
          {/* --- כותרת עריכה --- */}
          <Box display="flex" alignItems="center" gap={1}>
            {isEditingTitle ? (
              <>
                <TextField 
                  variant="standard" 
                  value={appTitle} 
                  onChange={(e) => setAppTitle(e.target.value)}
                  sx={{ fontSize: '1.5rem' }}
                />
                <IconButton onClick={saveTitle} color="success"><CheckIcon /></IconButton>
              </>
            ) : (
              <>
                <Typography variant="h5" component="h1" fontWeight="bold" color="primary">
                  {appTitle}
                </Typography>
                <IconButton onClick={() => setIsEditingTitle(true)} size="small" sx={{ opacity: 0.5 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="לוח פרויקטים" />
            <Tab label="משימות לעובדת" />
            <Tab label="סקירת נתונים" />
          </Tabs>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
             {/* כפתורי פעולות ראשיים */}
             <Tooltip title="📧 אימיילים והתראות">
               <IconButton onClick={() => setIsEmailNotificationOpen(true)} color="info" size="small">
                 <EmailOutlinedIcon />
               </IconButton>
             </Tooltip>
             
             <NotificationBell />
             
             <Tooltip title="💰 הוצאות עסקיות">
               <IconButton onClick={() => setIsBusinessExpensesOpen(true)} color="warning" size="small">
                 <ReceiptIcon />
               </IconButton>
             </Tooltip>
             
             <Tooltip title="💬 הודעות וואטסאפ">
               <IconButton onClick={() => setIsBulkMessagingOpen(true)} color="success" size="small">
                 <WhatsAppIcon />
               </IconButton>
             </Tooltip>
             
             <Tooltip title="💳 תזכורות תשלום">
               <IconButton onClick={() => setIsPaymentRemindersOpen(true)} color="warning" size="small">
                 <PaymentIcon />
               </IconButton>
             </Tooltip>
             
             <Tooltip title="📝 תבניות הודעות">
               <IconButton onClick={() => setIsMessageTemplatesOpen(true)} color="primary" size="small">
                 <MessageIcon />
               </IconButton>
             </Tooltip>
             
             {/* כפתורי כלים */}
             <Tooltip title="📊 ייצוא לאקסל">
                <IconButton color="success" href={DOWNLOAD_CSV_URL} size="small">
                  <FileDownloadIcon />
                </IconButton>
             </Tooltip>
             
             <Tooltip title="🔄 סנכרון קבצים">
                <IconButton onClick={() => syncFiles().then(() => alert('הקבצים סונכרנו לתיקיית CRM_Files'))} size="small">
                  <SyncIcon />
                </IconButton>
             </Tooltip>
             
             <Tooltip title="💾 גיבוי מלא">
                <IconButton onClick={handleManualBackup} color="warning" size="small">
                  <BackupIcon />
                </IconButton>
             </Tooltip>

             <Tooltip title="⚙️ הגדרות">
               <IconButton onClick={() => setIsSettingsOpen(true)} color="default" size="small">
                  <SettingsIcon />
               </IconButton>
             </Tooltip>

             <Tooltip title="👨‍💼 הגדרות אישיות">
               <IconButton onClick={() => setIsEngineerSettingsOpen(true)} size="small">
                 👨‍💼
               </IconButton>
             </Tooltip>

             <Tooltip title="אחוז מעם">
               <IconButton onClick={() => setIsVatSettingsOpen(true)} size="small" color="primary">
                 💰
               </IconButton>
             </Tooltip>

             {/* כפתור הדגמה */}
             {showSeedButton && (
                <Button onClick={handleSeed} color="secondary" size="small">
                  נתוני דמה
                </Button>
             )}

             {/* כפתור ראשי */}
             <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsDialogOpen(true)} sx={{ ml: 1 }}>
                עבודה חדשה
             </Button>
          </Box>
        </Box>

        {/* גוף האתר */}
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 80px)', gap: 2 }}>
          <Box sx={{ flex: '1 1 83%', minHeight: '100vh', height: 'auto', overflow: 'visible' }}>
            {tab === 0 && <ProjectBoard key={refreshTrigger} onOpenProject={handleOpenProject} />}
            {tab === 1 && <TaskManager onOpenProject={handleOpenProject} />}
            {tab === 2 && <Dashboard />}
          </Box>
          <Box sx={{ flex: '1 1 17%', height: '100%' }}>
            <UpcomingVisits />
          </Box>
        </Box>

        <AddProjectDialog 
          open={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          onProjectAdded={() => setRefreshTrigger(prev => prev + 1)}
        />

        <ProjectDetailsDialog 
          open={!!selectedProject} 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={() => setRefreshTrigger(prev => prev + 1)}
        />
        
        {/* --- כאן היה התיקון: העברנו את הפונקציות לדיאלוג --- */}
        <SettingsDialog 
            open={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            onToggleSeedBtn={handleToggleSeed}
            currentSeedState={showSeedButton}
        />

        <EngineerSettingsDialog 
            open={isEngineerSettingsOpen}
            onClose={() => setIsEngineerSettingsOpen(false)}
        />

        <BulkMessagingDialog
            open={isBulkMessagingOpen}
            onClose={() => setIsBulkMessagingOpen(false)}
            projects={projects}
        />

        <PaymentRemindersDialog
            open={isPaymentRemindersOpen}
            onClose={() => setIsPaymentRemindersOpen(false)}
        />

        <MessageTemplatesDialog
            open={isMessageTemplatesOpen}
            onClose={() => setIsMessageTemplatesOpen(false)}
        />

        <BusinessExpensesDialog
            open={isBusinessExpensesOpen}
            onClose={() => setIsBusinessExpensesOpen(false)}
        />
        
        <EmailNotificationDialog
            open={isEmailNotificationOpen}
            onClose={() => setIsEmailNotificationOpen(false)}
        />

        <VatSettingsDialog
            open={isVatSettingsOpen}
            onClose={() => setIsVatSettingsOpen(false)}
            onUpdated={() => setRefreshTrigger(prev => prev + 1)}
        />

      </Container>
    </>
  );
}

export default App;