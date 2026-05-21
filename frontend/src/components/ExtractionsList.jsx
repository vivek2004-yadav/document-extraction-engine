import React from 'react';

const ExtractionsList = ({ extractions, activeId, onSelect, onNewUpload }) => {
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>ExEngine</span>
        </div>
        <button 
          className="btn-secondary" 
          onClick={onNewUpload}
          style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          New
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-title">Extractions History</div>
        
        {extractions.length === 0 ? (
          <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--card-border)', borderRadius: '12px' }}>
            No past extractions found. Upload a file to begin!
          </div>
        ) : (
          extractions.map((item) => (
            <div 
              key={item.id} 
              className={`history-item ${activeId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div className="history-item-header">
                <span className="history-filename" title={item.filename}>
                  {item.filename}
                </span>
                <span className={`history-tag ${item.document_type}`}>
                  {item.document_type}
                </span>
              </div>
              <div className="history-meta">
                <span>{formatTime(item.timestamp)}</span>
                {item.status === 'success' ? (
                  <span style={{ color: 'var(--conf-high)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--conf-high)' }}></span>
                    Ready
                  </span>
                ) : (
                  <span style={{ color: 'var(--conf-low)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }} title={item.error_message}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--conf-low)' }}></span>
                    Error
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExtractionsList;
