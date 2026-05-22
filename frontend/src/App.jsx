import React, { useState, useEffect } from 'react';
import ExtractionsList from './components/ExtractionsList';
import DocumentUpload from './components/DocumentUpload';
import ExtractionResult from './components/ExtractionResult';
import Loader from './components/Loader';

const API_BASE = 'http://localhost:8000';

function App() {
  const [extractions, setExtractions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeExtraction, setActiveExtraction] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [apiProvider, setApiProvider] = useState(() => localStorage.getItem('ex_api_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ex_api_key') || '');
  const [isApiConfigured, setIsApiConfigured] = useState(false);

  useEffect(() => {
    fetchHistory();
    checkApiConfiguration();
  }, []);

  const checkApiConfiguration = () => {
    const key = localStorage.getItem('ex_api_key');
    setIsApiConfigured(!!key);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/extractions`);
      if (res.ok) {
        const data = await res.json();
        setExtractions(data);
      }
    } catch (e) {
      console.error("Failed to connect to backend:", e);
    }
  };

  const loadExtraction = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/extractions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveExtraction(data);
        setActiveId(id);
      }
    } catch (e) {
      alert("Failed to retrieve extraction details.");
    }
  };

  const handleUpload = async (file, docType) => {
    setIsProcessing(true);
    setProcessingMessage('Loading document data...');
    setActiveId(null);
    setActiveExtraction(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);
    
    const storedProvider = localStorage.getItem('ex_api_provider');
    const storedKey = localStorage.getItem('ex_api_key');
    if (storedProvider && storedKey) {
      formData.append('api_provider', storedProvider);
      formData.append('api_key', storedKey);
    }

    try {
      setTimeout(() => setProcessingMessage('Parsing data fields...'), 1800);
      
      const res = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        await fetchHistory();
        await loadExtraction(result.id);
      } else {
        const errData = await res.json();
        const msg = errData.detail?.error || errData.detail?.message || "Data processing failed.";
        alert(`Error: ${msg}`);
        await fetchHistory();
      }
    } catch (e) {
      alert("Communication error with backend. Is the FastAPI server running?");
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleSaveCorrections = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_BASE}/api/extractions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted_data: updatedData }),
      });

      if (res.ok) {
        alert("Corrections saved successfully!");
        await fetchHistory();
        await loadExtraction(id);
      } else {
        alert("Failed to save adjustments.");
      }
    } catch (e) {
      alert("Error saving adjustments.");
    }
  };

  const handleNewUpload = () => {
    setActiveId(null);
    setActiveExtraction(null);
  };

  const handleSaveApiSettings = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ex_api_provider', apiProvider);
      localStorage.setItem('ex_api_key', apiKey.trim());
      setIsApiConfigured(true);
    } else {
      localStorage.removeItem('ex_api_provider');
      localStorage.removeItem('ex_api_key');
      setIsApiConfigured(false);
    }
    setIsConfigOpen(false);
  };

  const handleResetApiSettings = () => {
    setApiKey('');
    localStorage.removeItem('ex_api_provider');
    localStorage.removeItem('ex_api_key');
    setIsApiConfigured(false);
    setIsConfigOpen(false);
  };

  return (
    <div className="app-container">
      <ExtractionsList 
        extractions={extractions}
        activeId={activeId}
        onSelect={loadExtraction}
        onNewUpload={handleNewUpload}
      />

      <div className="main-layout">
        <header className="top-nav">
          <div className="nav-left">
            <h2>Document Manager</h2>
          </div>
          <div className="nav-right">
            <button 
              className={`api-badge-button ${isApiConfigured ? 'configured' : ''}`}
              onClick={() => setIsConfigOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>{isApiConfigured ? 'Custom Credentials Active' : 'Configure Connection'}</span>
            </button>
          </div>
        </header>

        <main className="main-content">
          {isProcessing ? (
            <Loader message={processingMessage} />
          ) : activeExtraction ? (
            <ExtractionResult 
              extraction={activeExtraction}
              onSave={handleSaveCorrections}
            />
          ) : (
            <DocumentUpload 
              onUpload={handleUpload}
              isProcessing={isProcessing}
            />
          )}
        </main>
      </div>

      {isConfigOpen && (
        <div className="api-config-overlay">
          <div className="api-config-modal">
            <button className="modal-close" onClick={() => setIsConfigOpen(false)}>×</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Connection Settings</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Configure active connection credentials for data processing. If left blank, the server uses defaults.
              </p>
            </div>

            <div className="api-form-group">
              <label>Provider Type</label>
              <select 
                className="api-select"
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value)}
              >
                <option value="gemini">Default Provider (Gemini)</option>
                <option value="openai">Secondary Provider (OpenAI)</option>
              </select>
            </div>

            <div className="api-form-group">
              <label>Access Token</label>
              <input 
                type="password"
                className="api-input"
                placeholder={apiProvider === 'gemini' ? 'Enter key...' : 'Enter key...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, color: 'var(--conf-low)', borderColor: 'rgba(239, 68, 68, 0.15)' }} 
                onClick={handleResetApiSettings}
              >
                Reset Default
              </button>
              <button className="api-save-btn" style={{ flex: 1.5 }} onClick={handleSaveApiSettings}>
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
