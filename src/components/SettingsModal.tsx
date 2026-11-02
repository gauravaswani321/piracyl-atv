import React, { useState, useEffect, useRef } from 'react';
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
  const [playerEngine, setPlayerEngine] = useState<'exo' | 'vlc' | 'web' | 'ask'>(config.playerEngine || 'exo');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [focusedField, setFocusedField] = useState<'baseUrl' | 'rootPath' | null>(null);
  const baseUrlInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus first input when Settings opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        baseUrlInputRef.current?.focus();
        setFocusedField('baseUrl');
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setFocusedField(null);
    }
  }, [isOpen]);

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
      siteName: siteName.trim() || 'PiracyL ATV',
      playerEngine
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
        data-nav-modal="true"
        data-nav-container="true"
        role="dialog"
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
            <div
              className="input-focus-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: focusedField === 'baseUrl' ? '#182234' : '#0b0e14',
                border: focusedField === 'baseUrl' ? '2px solid #38bdf8' : '1px solid #2d3852',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: focusedField === 'baseUrl'
                  ? '0 0 22px rgba(56, 189, 248, 0.4), 0 4px 16px rgba(0, 0, 0, 0.5)'
                  : 'none',
                transform: focusedField === 'baseUrl' ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <Globe
                size={18}
                color={focusedField === 'baseUrl' ? '#38bdf8' : '#64748b'}
                style={{ marginRight: '10px', flexShrink: 0, transition: 'color 0.2s ease' }}
              />
              <input
                ref={baseUrlInputRef}
                data-nav-item="true"
                data-nav-default="true"
                tabIndex={0}
                type="text"
                value={baseUrl}
                placeholder="https://your-worker.workers.dev"
                onFocus={() => setFocusedField('baseUrl')}
                onBlur={() => setFocusedField((cur) => cur === 'baseUrl' ? null : cur)}
                onChange={(e) => setBaseUrl(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  width: '100%',
                  padding: '2px 0'
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
            <div
              className="input-focus-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: focusedField === 'rootPath' ? '#182234' : '#0b0e14',
                border: focusedField === 'rootPath' ? '2px solid #38bdf8' : '1px solid #2d3852',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: focusedField === 'rootPath'
                  ? '0 0 22px rgba(56, 189, 248, 0.4), 0 4px 16px rgba(0, 0, 0, 0.5)'
                  : 'none',
                transform: focusedField === 'rootPath' ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <Folder
                size={18}
                color={focusedField === 'rootPath' ? '#38bdf8' : '#64748b'}
                style={{ marginRight: '10px', flexShrink: 0, transition: 'color 0.2s ease' }}
              />
              <input
                data-nav-item="true"
                tabIndex={0}
                type="text"
                value={rootPath}
                placeholder="0:/"
                onFocus={() => setFocusedField('rootPath')}
                onBlur={() => setFocusedField((cur) => cur === 'rootPath' ? null : cur)}
                onChange={(e) => setRootPath(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  width: '100%',
                  padding: '2px 0'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
              Default Video Player Engine
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'exo' as const, label: 'In-App ExoPlayer (Recommended)', desc: 'Zero Jitter & Dolby Sound' },
                { id: 'vlc' as const, label: 'VLC / External Player', desc: 'All formats & external app' },
                { id: 'web' as const, label: 'Built-in Web Player', desc: 'In-app player with subtitle styling' },
                { id: 'ask' as const, label: 'Always Ask', desc: 'Prompt when selecting video' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-nav-item="true"
                  tabIndex={0}
                  onClick={() => setPlayerEngine(opt.id)}
                  style={{
                    flex: '1 1 calc(50% - 8px)',
                    minWidth: '160px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: playerEngine === opt.id ? '2px solid #38bdf8' : '1px solid #2d3852',
                    backgroundColor: playerEngine === opt.id ? 'rgba(56, 189, 248, 0.15)' : '#0b0e14',
                    color: playerEngine === opt.id ? '#38bdf8' : '#cbd5e1',
                    fontWeight: playerEngine === opt.id ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>{opt.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{opt.desc}</div>
                </button>
              ))}
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

