import React, { useState, useEffect } from 'react';

const ExtractionResult = ({ extraction, onSave }) => {
  const [editedData, setEditedData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

  useEffect(() => {
    if (extraction && extraction.extracted_data) {
      setEditedData(JSON.parse(JSON.stringify(extraction.extracted_data)));
      setIsDirty(false);
    }
  }, [extraction]);

  if (!extraction || !editedData) {
    return (
      <div className="empty-view">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
          <line x1="9" y1="11" x2="15" y2="11" />
        </svg>
        <p>No document selected. Select a past extraction from the history list or upload a new file.</p>
      </div>
    );
  }

  const handleFieldChange = (key, val) => {
    setEditedData(prev => {
      const updated = { ...prev };
      updated[key].value = val;
      return updated;
    });
    setIsDirty(true);
  };

  const handleArrayElementChange = (fieldKey, index, subKey, val) => {
    setEditedData(prev => {
      const updated = { ...prev };
      const list = [...updated[fieldKey].value];
      list[index] = { ...list[index], [subKey]: val };
      updated[fieldKey].value = list;
      return updated;
    });
    setIsDirty(true);
  };

  const handleFlatArrayChange = (fieldKey, valString) => {
    const list = valString.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setEditedData(prev => {
      const updated = { ...prev };
      updated[fieldKey].value = list;
      return updated;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(extraction.id, editedData);
    setIsDirty(false);
  };

  const handleReset = () => {
    setEditedData(JSON.parse(JSON.stringify(extraction.extracted_data)));
    setIsDirty(false);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Field,Value,Confidence,Note\n";

    Object.entries(editedData).forEach(([key, field]) => {
      if (!field) return;
      const label = key.replace(/_/g, " ");
      let val = "";
      
      if (Array.isArray(field.value)) {
        if (field.value.length > 0 && typeof field.value[0] === 'object') {
          val = '"' + field.value.map(obj => 
            Object.entries(obj).map(([sk, sv]) => `${sk}: ${sv}`).join(" | ")
          ).join("\n") + '"';
        } else {
          val = `"${field.value.join(", ")}"`;
        }
      } else {
        val = field.value !== null ? `"${field.value}"` : "null";
      }

      const conf = field.confidence || "N/A";
      const note = field.note ? `"${field.note.replace(/"/g, '""')}"` : "";
      
      csvContent += `"${label}",${val},"${conf}",${note}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extracted_${extraction.filename.split('.')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editedData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `extracted_${extraction.filename.split('.')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="results-layout">
      <div className="preview-panel">
        <div className="preview-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn-secondary ${activeTab === 'data' ? 'active' : ''}`}
              style={{ background: activeTab === 'data' ? 'rgba(255,255,255,0.06)' : 'none', border: 'none' }}
              onClick={() => setActiveTab('data')}
            >
              Document Source
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'raw_text' ? 'active' : ''}`}
              style={{ background: activeTab === 'raw_text' ? 'rgba(255,255,255,0.06)' : 'none', border: 'none' }}
              onClick={() => setActiveTab('raw_text')}
            >
              Raw Extracted Text
            </button>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {extraction.filename}
          </span>
        </div>
        
        {activeTab === 'data' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', padding: '40px', textAlign: 'center', background: '#fafafa' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', marginBottom: '12px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>Document Processed</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.5' }}>
              Data fields have been extracted and mapped to the standard document format.
            </p>
          </div>
        ) : (
          <div className="preview-content">
            {extraction.raw_text || "[Document details parsed directly from file image.]"}
          </div>
        )}
      </div>

      <div className="data-panel">
        <div className="data-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              Document Fields
            </span>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>
              {extraction.document_type.toUpperCase()}
            </h3>
          </div>

          <div className="results-header-actions">
            <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
            <button className="btn-secondary" onClick={handleExportJSON}>Export JSON</button>
            
            {isDirty && (
              <>
                <button 
                  className="btn-secondary" 
                  onClick={handleReset}
                  style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--conf-low)' }}
                >
                  Discard
                </button>
                <button className="btn-primary" onClick={handleSave}>Save changes</button>
              </>
            )}
          </div>
        </div>

        <div className="data-scroll">
          {Object.entries(editedData).map(([key, field]) => {
            if (!field) return null;
            
            const isArray = Array.isArray(field.value);
            const isNestedObjectArray = isArray && field.value.length > 0 && typeof field.value[0] === 'object';
            
            return (
              <div key={key} className="field-card">
                <div className="field-meta">
                  <span className="field-label">{key.replace(/_/g, " ")}</span>
                  <span className={`confidence-badge ${field.confidence || 'low'}`}>
                    {field.confidence === 'high' ? 'High' : field.confidence === 'medium' ? 'Medium' : 'Low'}
                  </span>
                </div>

                {isNestedObjectArray ? (
                  <div style={{ marginTop: '6px' }}>
                    {key === 'line_items' && (
                      <div>
                        <div className="nested-item-row header">
                          <span>Description</span>
                          <span>Quantity</span>
                          <span>Unit Price</span>
                          <span>Amount</span>
                        </div>
                        {field.value.map((item, idx) => (
                          <div key={idx} className="nested-item-row">
                            <input 
                              type="text" 
                              className="nested-item-input" 
                              value={item.description || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'description', e.target.value)}
                            />
                            <input 
                              type="number" 
                              className="nested-item-input" 
                              value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'quantity', parseInt(e.target.value) || null)}
                            />
                            <input 
                              type="number" 
                              step="any"
                              className="nested-item-input" 
                              value={item.unit_price !== null && item.unit_price !== undefined ? item.unit_price : ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'unit_price', parseFloat(e.target.value) || null)}
                            />
                            <input 
                              type="number" 
                              step="any"
                              className="nested-item-input" 
                              value={item.amount !== null && item.amount !== undefined ? item.amount : ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'amount', parseFloat(e.target.value) || null)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {key === 'experience' && (
                      <div>
                        <div className="nested-item-row header" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 2fr' }}>
                          <span>Job Title</span>
                          <span>Company</span>
                          <span>Period</span>
                          <span>Responsibilities</span>
                        </div>
                        {field.value.map((item, idx) => (
                          <div key={idx} className="nested-item-row" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 2fr' }}>
                            <input 
                              type="text" 
                              className="nested-item-input" 
                              value={item.job_title || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'job_title', e.target.value)}
                            />
                            <input 
                              type="text" 
                              className="nested-item-input" 
                              value={item.company || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'company', e.target.value)}
                            />
                            <input 
                              type="text" 
                              className="nested-item-input" 
                              value={item.period || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'period', e.target.value)}
                            />
                            <textarea 
                              className="nested-item-input" 
                              style={{ height: '34px', resize: 'none', fontFamily: 'inherit' }}
                              value={item.responsibilities || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'responsibilities', e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {key === 'education' && (
                      <div>
                        <div className="nested-item-row header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr' }}>
                          <span>Degree</span>
                          <span>Institution</span>
                          <span>Graduation Year</span>
                        </div>
                        {field.value.map((item, idx) => (
                          <div key={idx} className="nested-item-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr' }}>
                            <input 
                              type="text" 
                              className="nested-item-input" 
                              value={item.degree || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'degree', e.target.value)}
                            />
                            <input 
                              type="text" 
                              className="nested-item-input" 
                              value={item.institution || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'institution', e.target.value)}
                            />
                            <input 
                              type="text" 
                              className="nested-item-input" 
                              value={item.graduation_year || ''} 
                              onChange={(e) => handleArrayElementChange(key, idx, 'graduation_year', e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : isArray ? (
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-text-input"
                      value={field.value.join(", ")}
                      placeholder="Comma-separated items..."
                      onChange={(e) => handleFlatArrayChange(key, e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="field-input-wrapper">
                    <input 
                      type={typeof field.value === 'number' ? 'number' : 'text'}
                      step="any"
                      className={`field-text-input ${field.value === null ? 'null-field' : ''}`}
                      value={field.value !== null ? field.value : ''}
                      placeholder="null (Missing field)"
                      onChange={(e) => {
                        const val = e.target.value;
                        const parsedVal = typeof field.value === 'number' ? (parseFloat(val) || 0) : val;
                        handleFieldChange(key, val === '' ? null : parsedVal);
                      }}
                    />
                  </div>
                )}
                
                {field.note && <div className="field-note">ℹ️ {field.note}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExtractionResult;
