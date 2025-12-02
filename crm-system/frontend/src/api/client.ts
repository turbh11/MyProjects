import axios from 'axios';

const API_URL = '/api'; // בשימוש עם Docker ו-Nginx
//const API_URL = 'http://localhost:3000';
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
export const syncFiles = async () => {
  await apiClient.post('/projects/sync');
};
// --- הגדרת המבנה המלא של פרויקט ---
export interface Project {
  id: number;
  clientName: string;
  description: string;
  // רשימת הסטטוסים המעודכנת
  status: 'Pre-Work' | 'Proposal Sent' | 'In-Progress' | 'Done';
  
  // שדות כתובת
  location: string;       // עיר / יישוב
  street?: string;        // רחוב
  buildingNumber?: string;// מספר בית
  district: string;       // מחוז
  
  // כספים
  totalPrice: number;
  totalPaid: number;      // מחושב בשרת
  vatPercentage?: number; // אחוז מע"מ

  // שדות נוספים
  phoneNumber?: string;
  isArchived: boolean;
  
  // תאריכים
  createdAt: string;
  updatedAt: string;

  proposalText?: string;
}
export const DOWNLOAD_CSV_URL = `${API_URL}/projects/export/csv`;
export const DOWNLOAD_ZIP_URL = `${API_URL}/attachments/download-zip`;
// ----------------------------------

export const getProjects = async (): Promise<Project[]> => {
  const response = await apiClient.get('/projects');
  return response.data;
};

// עדכון ביצירה: השמטנו שדות שמחושבים בשרת
export const createProject = async (projectData: any) => {
  const response = await apiClient.post('/projects', projectData);
  return response.data;
};

// --- שאר הפונקציות (כדי שלא יחסר לך כלום) ---

// Payments
export interface Payment {
  id: number;
  amount: number;
  note: string;
  date: string;
  projectId: number;
}

export const getProjectPayments = async (projectId: number): Promise<Payment[]> => {
  const response = await apiClient.get(`/payments/project/${projectId}`);
  return response.data;
};

export const addPayment = async (paymentData: { amount: number; note: string; projectId: number; date?: string }) => {
  const response = await apiClient.post('/payments', paymentData);
  return response.data;
};

// Visits
export interface Visit {
  id: number;
  description: string;
  nextActions: string;
  visitDate: string;
  projectId: number;
}

export const getProjectVisits = async (projectId: number): Promise<Visit[]> => {
  const response = await apiClient.get(`/visits/project/${projectId}`);
  return response.data;
};

export const addVisit = async (visitData: { description: string; nextActions: string; projectId: number; visitDate?: string }) => {
  const response = await apiClient.post('/visits', visitData);
  return response.data;
};

// Upcoming Visits
export const getUpcomingVisits = async () => {
  const response = await apiClient.get('/visits/upcoming');
  return response.data;
};

// Tasks
export interface Task {
  id: number;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  isDone: boolean;
  projectId?: number;
  project?: Project;
}

export const getTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get('/tasks');
  return response.data;
};

export const createTask = async (task: { description: string; priority: string; projectId?: number }) => {
  const response = await apiClient.post('/tasks', task);
  return response.data;
};

export const toggleTask = async (id: number) => {
  const response = await apiClient.patch(`/tasks/${id}/toggle`);
  return response.data;
};

export const deleteTask = async (id: number) => {
  const response = await apiClient.delete(`/tasks/${id}`);
  return response.data;
};

// Attachments
export interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  projectId: number;
}

export const getAttachments = async (projectId: number): Promise<Attachment[]> => {
  const response = await apiClient.get(`/attachments/project/${projectId}`);
  return response.data;
};

export const uploadAttachment = async (file: File, projectId: number) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId.toString());

  const response = await apiClient.post('/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAttachment = async (id: number) => {
   await apiClient.delete(`/attachments/${id}`);
};

// הוסף את זה:
export const updateProject = async (id: number, data: Partial<Project>) => {
  const response = await apiClient.patch(`/projects/${id}`, data);
  return response.data;
};

export const generateProposal = async (id: number) => {
  const response = await apiClient.post(`/projects/${id}/generate-proposal`);
  return response.data;
};

// ניהול תבניות הצעות מחיר
export const getProposalTemplate = async () => {
  const response = await apiClient.get('/projects/proposal-template');
  return response.data;
};

export const updateProposalTemplate = async (template: string) => {
  const response = await apiClient.post('/projects/proposal-template', { template });
  return response.data;
};

// עריכה מובנית של הצעות מחיר
export const getProposalContent = async (projectId: number) => {
  const response = await apiClient.get(`/projects/${projectId}/proposal-content`);
  return response.data;
};

export const updateProposalContent = async (projectId: number, content: string) => {
  const response = await apiClient.post(`/projects/${projectId}/update-proposal`, { content });
  return response.data;
};

// הורדת קובץ יחיד - פשוט ויעיל
export const downloadSingleFile = (fileId: number) => {
  const url = `${API_URL}/attachments/download/${fileId}`;
  window.open(url, '_blank');
};

// מחיקת קבצים מרובים
export const deleteMultipleAttachments = async (ids: number[]) => {
  await Promise.all(ids.map(id => apiClient.delete(`/attachments/${id}`)));
};

// יצירת תיקייה - פשוט ובטוח
export const createFolder = async (projectId: number, folderName: string) => {
  try {
    console.log('שליחת בקשת יצירת תיקייה...', { projectId, folderName });
    const response = await apiClient.post('/attachments/folder', { projectId, folderName });
    console.log('תגובה מהשרת:', response.data);
    return response.data;
  } catch (error) {
    console.error('שגיאה בAPI createFolder:', error);
    throw error;
  }
};


// פונקציות הגדרות כלליות
export const getSetting = async (key: string) => {
  try {
    const response = await apiClient.get(`/settings/${key}`);
    return response.data;
  } catch (e) {
    return null;
  }
};

export const saveSetting = async (key: string, value: string) => {
  const response = await apiClient.post('/settings', { key, value });
  return response.data;
};

// Backup
export const createManualBackup = async () => {
  const response = await apiClient.post('/backup/manual');
  return response.data;
};

// Expenses
export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  projectId: number;
}

export const getProjectExpenses = async (projectId: number): Promise<Expense[]> => {
  const response = await apiClient.get(`/expenses/project/${projectId}`);
  return response.data;
};

export const addExpense = async (expenseData: { amount: number; description: string; category: string; projectId: number; date?: string }) => {
  const response = await apiClient.post('/expenses', expenseData);
  return response.data;
};

export const updateExpense = async (id: number, data: Partial<Expense>) => {
  const response = await apiClient.put(`/expenses/${id}`, data);
  return response.data;
};

export const deleteExpense = async (id: number) => {
  await apiClient.delete(`/expenses/${id}`);
};

// Tax Tracking
export interface TaxInfo {
  untaxedAmount: number;
  taxPercentage: number;
  calculatedTax: number;
}

export const getTaxInfo = async (): Promise<TaxInfo> => {
  const response = await apiClient.get('/tax/info');
  return response.data;
};

export const updateTaxPercentage = async (percentage: number) => {
  const response = await apiClient.put('/tax/percentage', { percentage });
  return response.data;
};

export const resetTaxTracker = async () => {
  const response = await apiClient.post('/tax/reset');
  return response.data;
};

// Monthly Data
export interface MonthlyData {
  month: number;
  year: number;
  revenue: number;
  expenses: number;
  netProfit: number;
  tax: number;
  taxPercentage: number;
  paymentsCount: number;
  monthName?: string;
  monthShort?: string;
}

export const getMonthlyData = async (month: number, year: number): Promise<MonthlyData> => {
  const response = await apiClient.get(`/payments/monthly-data?month=${month}&year=${year}`);
  return response.data;
};

export const getMonthlyBreakdown = async (months: number = 6): Promise<MonthlyData[]> => {
  const response = await apiClient.get(`/payments/monthly-breakdown?months=${months}`);
  return response.data;
};

// Engineer Info Management
export interface EngineerInfo {
  name: string;
  email: string;
  phone: string;
}

export const getEngineerInfo = async (): Promise<EngineerInfo> => {
  const response = await apiClient.get('/settings/engineer-info');
  return response.data;
};

export const updateEngineerInfo = async (engineerInfo: EngineerInfo) => {
  const response = await apiClient.put('/settings/engineer-info', engineerInfo);
  return response.data;
};