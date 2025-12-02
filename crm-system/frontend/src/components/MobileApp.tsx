import React, { useState, useEffect } from 'react';

interface MobileAppProps {
  // Simple mobile app without heavy dependencies
}

const MobileApp: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    app: {
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl' as const,
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '10px'
    },
    header: {
      textAlign: 'center' as const,
      color: 'white',
      padding: '20px 0',
      fontSize: '1.8rem',
      fontWeight: 'bold'
    },
    container: {
      maxWidth: '400px',
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
    },
    card: {
      backgroundColor: '#f8f9fa',
      border: '2px solid #e9ecef',
      borderRadius: '10px',
      padding: '15px',
      margin: '10px 0',
      textAlign: 'center' as const
    },
    statCard: {
      backgroundColor: '#e3f2fd',
      border: '2px solid #1976d2',
      borderRadius: '10px',
      padding: '15px',
      margin: '10px 0',
      textAlign: 'center' as const
    },
    button: {
      backgroundColor: '#1976d2',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '8px',
      margin: '5px',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      margin: '15px 0'
    },
    loading: {
      textAlign: 'center' as const,
      padding: '40px',
      fontSize: '1.2rem'
    }
  };

  if (loading) {
    return (
      <div style={styles.app}>
        <div style={styles.header}>🏢 מערכת CRM</div>
        <div style={styles.container}>
          <div style={styles.loading}>
            <div>⏳ טוען נתונים...</div>
            <div style={{ fontSize: '0.9rem', marginTop: '10px', color: '#666' }}>
              אנא המתן כמה שניות
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.app}>
        <div style={styles.header}>🏢 מערכת CRM</div>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={{ color: '#d32f2f', fontSize: '1.1rem', marginBottom: '10px' }}>
              ⚠️ {error}
            </div>
            <button style={styles.button} onClick={fetchData}>
              🔄 נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.header}>📱 CRM נייד</div>
      
      <div style={styles.container}>
        {/* Status Card */}
        <div style={{ ...styles.card, backgroundColor: '#e8f5e8', borderColor: '#4caf50' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px' }}>
            ✅ המערכת פועלת
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            חוברת בהצלחה לשרת
          </div>
        </div>

        {/* Stats Grid */}
        <div style={styles.grid}>
          <div style={styles.statCard}>
            <div style={{ fontSize: '2rem' }}>💰</div>
            <div style={{ fontSize: '0.9rem', margin: '5px 0' }}>הכנסות</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              ₪{stats?.totalRevenue?.toLocaleString() || '0'}
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ fontSize: '2rem' }}>📊</div>
            <div style={{ fontSize: '0.9rem', margin: '5px 0' }}>פרויקטים</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {stats?.activeProjects || '0'}
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ fontSize: '2rem' }}>💳</div>
            <div style={{ fontSize: '0.9rem', margin: '5px 0' }}>הוצאות</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              ₪{stats?.totalExpenses?.toLocaleString() || '0'}
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ fontSize: '2rem' }}>📈</div>
            <div style={{ fontSize: '0.9rem', margin: '5px 0' }}>רווח</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              ₪{stats?.netProfit?.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button style={styles.button} onClick={fetchData}>
            🔄 רענן נתונים
          </button>
          <button style={styles.button} onClick={() => window.location.href = '/api/projects'}>
            📋 פרויקטים
          </button>
        </div>

        {/* PWA Info */}
        <div style={{ ...styles.card, backgroundColor: '#fff3e0', borderColor: '#ff9800', marginTop: '20px' }}>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#e65100', marginBottom: '8px' }}>
            📱 התקן כאפליקציה
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
            לחץ על תפריט הדפדפן ובחר "הוסף למסך הבית" או "התקן אפליקציה"
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '15px', color: '#666', fontSize: '0.8rem' }}>
          🌐 גישה מכל מקום | 📧 מיילים אמיתיים<br/>
          💾 גיבויים אוטומטיים | 🔒 מאובטח
        </div>
      </div>
    </div>
  );
};

export default MobileApp;