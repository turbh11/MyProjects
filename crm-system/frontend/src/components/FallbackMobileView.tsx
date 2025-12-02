import React from 'react';

export const FallbackMobileView = () => {
  // Simple fallback that just redirects to static HTML if Material-UI fails
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/mobile-fallback.html';
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f7ff',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl'
    }}>
      <h1 style={{ color: '#1976d2', fontSize: '2rem', marginBottom: '20px' }}>
        🏢 מערכת CRM
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '400px',
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>
          ✅ המערכת פועלת
        </h2>
        
        <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
          המערכת עולה בהצלחה!<br/>
          טוען את הגרסה המותאמת לנייד...
        </p>
        
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          border: '2px solid #4caf50',
          marginBottom: '15px'
        }}>
          <strong style={{ color: '#2e7d32' }}>📱 גרסת טלפון נייד</strong>
          <br />
          <small>המערכת מותאמת לטלפון שלך</small>
        </div>
        
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          אם לא עובר לדף הבא, <a href="/mobile-fallback.html" style={{ color: '#1976d2' }}>לחץ כאן</a>
        </p>
      </div>
    </div>
  );
};