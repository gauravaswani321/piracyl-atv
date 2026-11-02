import React from 'react';
import { Folder, Film, Play, Clock, HardDrive } from 'lucide-react';
import { DriveFile } from '../types/drive';
import { getFileCategory, formatFileSize } from '../services/workerApi';
import { getPlaybackProgress } from '../services/videoPlayerService';

interface VideoGridProps {
  files: DriveFile[];
  loading: boolean;
  onFileSelect: (file: DriveFile) => void;
  onFolderSelect: (folder: DriveFile) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  files,
  loading,
  onFileSelect,
  onFolderSelect
}) => {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '65vh',
          gap: '16px',
          color: '#94a3b8'
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid #1e293b',
            borderTop: '4px solid #38bdf8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Scanning Google Drive files...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '65vh',
          gap: '16px',
          color: '#64748b'
        }}
      >
        <Film size={64} strokeWidth={1.5} color="#334155" />
        <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '1.3rem' }}>No video files found</h3>
        <p style={{ margin: 0, color: '#64748b' }}>
          This folder does not contain any videos or matching search items.
        </p>
      </div>
    );
  }

  return (
    <div
      data-nav-container="true"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '24px',
        padding: '28px 32px 64px 32px'
      }}
    >
      {files.map((file, index) => {
        const category = getFileCategory(file);
        const isFolder = category === 'folder';
        const ext = file.name.split('.').pop()?.toUpperCase() || '';
        const progress = !isFolder ? getPlaybackProgress(file.id) : null;
        const percent =
          progress && progress.duration > 0
            ? Math.min(100, Math.round((progress.currentTime / progress.duration) * 100))
            : 0;

        return (
          <div
            key={file.id || file.link || index}
            data-nav-item="true"
            data-nav-default={index === 0 ? 'true' : undefined}
            tabIndex={0}
            onClick={() => (isFolder ? onFolderSelect(file) : onFileSelect(file))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                isFolder ? onFolderSelect(file) : onFileSelect(file);
              }
            }}
            style={{
              background: '#151b28',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              userSelect: 'none'
            }}
          >
            {/* Card Thumbnail / Preview Banner */}
            <div
              style={{
                height: '140px',
                background: isFolder
                  ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                  : 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {isFolder ? (
                <Folder size={56} color="#f59e0b" strokeWidth={1.75} />
              ) : (
                <Film size={54} color="#38bdf8" strokeWidth={1.75} />
              )}

              {/* Format Badge (e.g. MKV, MP4, DIR) */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  background: isFolder
                    ? 'rgba(245, 158, 11, 0.2)'
                    : ext === 'MKV'
                    ? 'rgba(168, 85, 247, 0.3)'
                    : 'rgba(56, 189, 248, 0.25)',
                  color: isFolder
                    ? '#fbbf24'
                    : ext === 'MKV'
                    ? '#d8b4fe'
                    : '#7dd3fc',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {isFolder ? 'FOLDER' : ext || 'VIDEO'}
              </div>

              {/* Play icon overlay on hover/focus */}
              {!isFolder && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: '#e2e8f0'
                  }}
                >
                  <Play size={12} fill="#38bdf8" color="#38bdf8" />
                  <span>Play</span>
                </div>
              )}

              {/* Playback Progress Bar */}
              {percent > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percent}%`,
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Card Content Details */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                title={file.name}
                style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#f8fafc',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.35',
                  minHeight: '2.7em'
                }}
              >
                {file.name}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: '#94a3b8'
                }}
              >
                <span>{isFolder ? 'Folder' : formatFileSize(file.size)}</span>
                {percent > 0 && (
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {percent}% watched
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
