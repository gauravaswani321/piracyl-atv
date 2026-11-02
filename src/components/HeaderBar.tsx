import React from 'react';
import {
  FolderUp,
  RefreshCw,
  Search,
  Settings,
  HardDrive,
  Film
} from 'lucide-react';
import { DriveFolder } from '../types/drive';

interface HeaderBarProps {
  currentFolder: DriveFolder;
  folderHistory: DriveFolder[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateUp: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  loading: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentFolder,
  folderHistory,
  searchQuery,
  onSearchChange,
  onNavigateUp,
  onRefresh,
  onOpenSettings,
  loading
}) => {
  const canGoUp = folderHistory.length > 0;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        background: 'rgba(11, 14, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      {/* Left: Branding & Folder Path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '55%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            padding: '8px 14px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)'
          }}
        >
          <Film size={22} color="#0f172a" strokeWidth={2.5} />
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '0.04em' }}>
            PiracyL ATV
          </span>
        </div>

        {canGoUp && (
          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={onNavigateUp}
            title="Go to Parent Folder"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#1a2232',
              border: '1px solid #2d3852',
              borderRadius: '10px',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <FolderUp size={18} />
            <span>Up One Level</span>
          </button>
        )}

        {canGoUp && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              fontSize: '0.95rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <HardDrive size={16} />
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
              {currentFolder.name || currentFolder.path}
            </span>
          </div>
        )}
      </div>

      {/* Right: Controls & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#151b28',
            border: '1px solid #2d3852',
            borderRadius: '10px',
            padding: '4px 12px',
            width: '260px'
          }}
        >
          <Search size={18} color="#64748b" style={{ marginRight: '8px' }} />
          <input
            data-nav-item="true"
            tabIndex={0}
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.9rem',
              width: '100%',
              padding: '6px 0'
            }}
          />
        </div>

        {/* Refresh Button */}
        <button
          data-nav-item="true"
          tabIndex={0}
          onClick={onRefresh}
          title="Refresh Current Folder"
          style={{
            background: '#151b28',
            border: '1px solid #2d3852',
            borderRadius: '10px',
            color: '#cbd5e1',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>

        {/* Settings Button */}
        <button
          data-nav-item="true"
          tabIndex={0}
          onClick={onOpenSettings}
          title="App Settings & Worker URL"
          style={{
            background: '#151b28',
            border: '1px solid #2d3852',
            borderRadius: '10px',
            color: '#cbd5e1',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

