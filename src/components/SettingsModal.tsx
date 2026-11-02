import React, { useState } from 'react';
import { X, Check, Globe, Folder, ShieldCheck, AlertCircle } from 'lucide-react';
import { WorkerConfig } from '../types/drive';
import { fetchFolderContents } from '../services/workerApi';

interface SettingsModalProps {
  config: WorkerConfig;
  isOpen: boolean;
  onSave: (config: WorkerConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isOpen,
  onSave,
  onClose
}) => {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [rootPath, setRootPath] = useState(config.rootPath || '0:/');
  const [siteName, setSiteName] = useState(config.siteName || 'PiracyL ATV');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const res = await fetchFolderContents(
        { baseUrl: cleanUrl, rootPath, siteName },
        rootPath
      );
      setTestResult({
        success: true,
        message: `Success! Connected to Worker. Found ${res.files.length} items.`
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message || 'Make sure CORS is enabled in the worker config.'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      baseUrl: baseUrl.trim().replace(/\/+$/, ''),
      rootPath: rootPath.trim() || '0:/',
      siteName: siteName.trim() || 'PiracyL ATV'
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        data-nav-container="true"
        style={{
          background: '#151b28',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '620px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc', fontWeight: 700 }}>
            Cloudflare Worker Settings
          </h2>
          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
              Cloudflare Worker URL
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#0b0e14', border: '1px solid #2d3852', borderRadius: '10px', padding: '10px 14px' }}>
              <Globe size={18} color="#64748b" style={{ marginRight: '10px' }} />
              <input
                data-nav-item="true"
                data-nav-default="true"
                tabIndex={0}
                type="text"
                value={baseUrl}
                placeholder="https://your-worker.workers.dev"
                onChange={(e) => setBaseUrl(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  width: '100%'
                }}
              />
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              The deployed GDI-JS Cloudflare Workers URL containing your Google Drive proxy.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
              Default Root Path
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#0b0e14', border: '1px solid #2d3852', borderRadius: '10px', padding: '10px 14px' }}>
              <Folder size={18} color="#64748b" style={{ marginRight: '10px' }} />
              <input
                data-nav-item="true"
                tabIndex={0}
                type="text"
                value={rootPath}
                placeholder="0:/"
                onChange={(e) => setRootPath(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: testResult.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: testResult.success ? '#4ade80' : '#f87171',
                fontSize: '0.9rem'
              }}
            >
              {testResult.success ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px', marginTop: '12px' }}>
          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={handleTestConnection}
            disabled={testing}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid #2d3852',
              background: '#1a2232',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}
          >
            <Check size={18} strokeWidth={2.5} />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
