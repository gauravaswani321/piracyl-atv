import React, { useState } from 'react';
import { Tv, Play, Sparkles, Check, Volume2, ShieldCheck, Film, ExternalLink } from 'lucide-react';
import { DriveFile } from '../types/drive';

interface PlayerChoiceModalProps {
  isOpen: boolean;
  file: DriveFile | null;
  onSelectPlayer: (engine: 'exo' | 'vlc' | 'web', remember: boolean) => void;
  onClose: () => void;
}

export const PlayerChoiceModal: React.FC<PlayerChoiceModalProps> = ({
  isOpen,
  file,
  onSelectPlayer,
  onClose
}) => {
  const [remember, setRemember] = useState(false);

  if (!isOpen || !file) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: '#10151f',
          borderRadius: '20px',
          border: '1px solid #2d3852',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', marginBottom: '6px' }}>
            <Film size={22} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Select Player Engine
            </span>
          </div>
          <h2
            style={{
              margin: 0,
              color: '#f8fafc',
              fontSize: '1.25rem',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {file.name}
          </h2>
        </div>

        {/* Player Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Option 1: Native ExoPlayer (Recommended) */}
          <button
            data-nav-item="true"
            tabIndex={0}
            autoFocus
            onClick={() => onSelectPlayer('exo', remember)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '16px 20px',
              borderRadius: '14px',
              border: '2px solid #38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Play size={24} color="#0f172a" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
                  In-App Native ExoPlayer
                </span>
                <span
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.04em'
                  }}
                >
                  DEFAULT
                </span>
              </div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Runs inside the app. Native hardware SurfaceView (zero jitter), Dolby Digital passthrough, and 1-click switch to VLC.
              </p>
            </div>
          </button>

          {/* Option 2: VLC / External Player */}
          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={() => onSelectPlayer('vlc', remember)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '16px 20px',
              borderRadius: '14px',
              border: '1px solid #2d3852',
              backgroundColor: '#161d2d',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#ff8800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Tv size={24} color="#ffffff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.02rem', color: '#f8fafc', marginBottom: '4px' }}>
                VLC / Just Player (External)
              </div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
                External app fallback for rare audio formats, DTS-HD, or stylized anime subtitles (.ass).
              </p>
            </div>
          </button>

          {/* Option 3: Built-in Web Player */}
          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={() => onSelectPlayer('web', remember)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: '1px solid #2d3852',
              backgroundColor: '#161d2d',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Film size={22} color="#38bdf8" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#f8fafc', marginBottom: '2px' }}>
                Built-in Web Player
              </div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
                In-app player with custom subtitle styling and sync adjuster. Requires AAC audio.
              </p>
            </div>
          </button>
        </div>

        {/* Remember Choice Checkbox & Cancel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
          <label
            data-nav-item="true"
            tabIndex={0}
            onClick={() => setRemember(!remember)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setRemember(!remember);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                border: remember ? '2px solid #38bdf8' : '2px solid #475569',
                backgroundColor: remember ? '#38bdf8' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              {remember && <Check size={14} color="#0f172a" strokeWidth={3} />}
            </div>
            <span>Remember choice (change in Settings)</span>
          </label>

          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
