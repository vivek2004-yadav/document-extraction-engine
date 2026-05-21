import React, { useState, useRef } from 'react';

const DocumentUpload = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('invoice');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const validExtensions = ['pdf', 'txt', 'png', 'jpg', 'jpeg', 'docx'];
    
    if (validExtensions.includes(ext)) {
      setFile(selectedFile);
    } else {
      alert("Unsupported file format. Please upload PDF, DOCX, TXT, PNG, or JPG.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleSubmit = () => {
    if (!file) return;
    onUpload(file, docType);
  };

  return (
    <div className="upload-hero">
      <div className="hero-text">
        <h1>Intelligent Document Extraction</h1>
        <p>Upload invoices, resumes, or contract agreements to parse them into structured, validated JSON datasets instantly.</p>
      </div>

      <div 
        className={`upload-panel ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          onChange={handleChange}
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          disabled={isProcessing}
        />

        <div className="upload-icon-wrapper">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        {file ? (
          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>
              {file.name}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {(file.size / 1024).toFixed(1)} KB • Click to change file
            </p>
            <button 
              className="btn-secondary" 
              onClick={handleClear} 
              style={{ padding: '6px 12px', fontSize: '11px', margin: '8px auto 0 auto' }}
            >
              Clear Staged File
            </button>
          </div>
        ) : (
          <div style={{ pointerEvents: 'none' }}>
            <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Drag & drop document here, or click to browse
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Supports PDF, DOCX, Plain Text (TXT), PNG, and JPG up to 10MB
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', width: '600px', alignItems: 'center' }}>
        <select 
          className="doc-type-selector" 
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={isProcessing}
        >
          <option value="invoice">📄 Document Type: Invoice Schema</option>
          <option value="resume">👤 Document Type: Resume Schema</option>
          <option value="contract">📜 Document Type: Contract Schema</option>
        </select>

        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={!file || isProcessing}
        >
          <span>Begin Extraction</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
