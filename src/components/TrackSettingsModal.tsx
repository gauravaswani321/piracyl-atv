import React, { useState } from 'react';
import {
  Subtitles,
  Volume2,
  ExternalLink,
  X,
  Check,
  Plus,
  Minus,
  Settings2,
  Tv
} from 'lucide-react';
import { SubtitleTrack, SubtitleSettings } from '../services/subtitleService';
import { DriveFile } from '../types/drive';

interface AudioTrackInfo {
  id: string;
  label: string;
  language: string;
  enabled: boolean;
}

interface TrackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Subtitle props
  subtitleTracks: SubtitleTrack[];
  selectedSubtitleId: string | null;
  onSelectSubtitle: (id: string | null) => void;
  subtitleSettings: SubtitleSettings;
  onUpdateSubtitleSettings: (settings: SubtitleSettings) => void;
  siblingSubFiles: DriveFile[];
  onLoadSiblingSubtitle: (file: DriveFile) => void;
  // Audio props
  audioTracks: AudioTrackInfo[];
  selectedAudioTrackId: string | null;
  onSelectAudioTrack: (id: string) => void;
  // External player launch
  streamUrl: string;
  fileName: string;
}

export const TrackSettingsModal: React.FC<TrackSettingsModalProps> = ({
  isOpen,
  onClose,
  subtitleTracks,
  selectedSubtitleId,
  onSelectSubtitle,
  subtitleSettings,
  onUpdateSubtitleSettings,
  siblingSubFiles,
  onLoadSiblingSubtitle,
  audioTracks,
  selectedAudioTrackId,
  onSelectAudioTrack,
  streamUrl,
  fileName
}) => {
  const [activeTab, setActiveTab] = useState<'subtitles' | 'audio' | 'external'>('subtitles');

  if (!isOpen) return null;

  const handleLaunchExternal = () => {
    // Open in intent or new window (VLC handles raw stream URLs via protocol or download intent)
    window.open(streamUrl, '_blank');
  };

  const fontSizes = [
    { label: 'Small', value: 'small' as const },
    { label: 'Medium', value: 'medium' as const },
    { label: 'Large', value: 'large' as const },
    { label: 'X-Large', value: 'xlarge' as const }
  ];

  const colors = [
    { label: 'White', value: '#ffffff' },
    { label: 'Yellow', value: '#facc15' },
    { label: 'Cyan', value: '#38bdf8' },
    { label: 'Green', value: '#4ade80' }
  ];

  const backgrounds = [
    { label: 'Transparent', value: 'none' },
    { label: 'Semi-Black', value: 'rgba(0, 0, 0, 0.75)' },
    { label: 'Solid Black', value: '#000000' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-nav-container="true"
        style={{
          background: '#151b28',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={() => setActiveTab('subtitles')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'subtitles' ? '#38bdf8' : 'transparent',
                color: activeTab === 'subtitles' ? '#0f172a' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              <Subtitles size={18} />
              <span>Subtitles</span>
            </button>

            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={() => setActiveTab('audio')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'audio' ? '#38bdf8' : 'transparent',
                color: activeTab === 'audio' ? '#0f172a' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              <Volume2 size={18} />
              <span>Audio Languages</span>
            </button>

            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={() => setActiveTab('external')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'external' ? '#38bdf8' : 'transparent',
                color: activeTab === 'external' ? '#0f172a' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              <Tv size={18} />
              <span>External App</span>
            </button>
          </div>

          <button
            data-nav-item="true"
            tabIndex={0}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TAB 1: SUBTITLES */}
          {activeTab === 'subtitles' && (
            <>
              {/* Off / Track Select */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
                  AVAILABLE SUBTITLE TRACKS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                  {/* Off Option */}
                  <button
                    data-nav-item="true"
                    data-nav-default="true"
                    tabIndex={0}
                    onClick={() => onSelectSubtitle(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: selectedSubtitleId === null ? '2px solid #38bdf8' : '1px solid #2d3852',
                      background: selectedSubtitleId === null ? 'rgba(56, 189, 248, 0.15)' : '#10151f',
                      color: selectedSubtitleId === null ? '#38bdf8' : '#f8fafc',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    <span>Subtitles Off</span>
                    {selectedSubtitleId === null && <Check size={18} />}
                  </button>

                  {/* Loaded Tracks */}
                  {subtitleTracks.map((track) => (
                    <button
                      key={track.id}
                      data-nav-item="true"
                      tabIndex={0}
                      onClick={() => onSelectSubtitle(track.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: selectedSubtitleId === track.id ? '2px solid #38bdf8' : '1px solid #2d3852',
                        background: selectedSubtitleId === track.id ? 'rgba(56, 189, 248, 0.15)' : '#10151f',
                        color: selectedSubtitleId === track.id ? '#38bdf8' : '#f8fafc',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.label}</span>
                      {selectedSubtitleId === track.id && <Check size={18} style={{ flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sibling Subtitle files in the same folder */}
              {siblingSubFiles.length > 0 && (
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
                    SUBTITLE FILES DETECTED IN GOOGLE DRIVE FOLDER
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {siblingSubFiles.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#10151f',
                          border: '1px solid #2d3852',
                          borderRadius: '8px'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f.name}
                        </span>
                        <button
                          data-nav-item="true"
                          tabIndex={0}
                          onClick={() => onLoadSiblingSubtitle(f)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: '#1e293b',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          Load Track
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtitle Appearance Settings */}
              {selectedSubtitleId !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700 }}>
                    <Settings2 size={18} />
                    <span>Subtitle Customization</span>
                  </div>

                  {/* Size */}
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>Font Size</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {fontSizes.map((s) => (
                        <button
                          key={s.value}
                          data-nav-item="true"
                          tabIndex={0}
                          onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, fontSize: s.value })}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: subtitleSettings.fontSize === s.value ? '2px solid #38bdf8' : '1px solid #2d3852',
                            background: subtitleSettings.fontSize === s.value ? 'rgba(56, 189, 248, 0.2)' : '#10151f',
                            color: '#f8fafc',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>Text Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {colors.map((c) => (
                        <button
                          key={c.value}
                          data-nav-item="true"
                          tabIndex={0}
                          onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, color: c.value })}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: subtitleSettings.color === c.value ? '2px solid #38bdf8' : '1px solid #2d3852',
                            background: subtitleSettings.color === c.value ? 'rgba(56, 189, 248, 0.2)' : '#10151f',
                            color: c.value,
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sync Offset Delay */}
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>
                      Subtitle Sync / Timing ({subtitleSettings.delaySeconds > 0 ? `+${subtitleSettings.delaySeconds}s` : `${subtitleSettings.delaySeconds}s`})
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        data-nav-item="true"
                        tabIndex={0}
                        onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, delaySeconds: Number((subtitleSettings.delaySeconds - 0.5).toFixed(1)) })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: '#10151f',
                          border: '1px solid #2d3852',
                          color: '#f8fafc',
                          fontSize: '0.85rem'
                        }}
                      >
                        <Minus size={16} /> 0.5s Earlier
                      </button>

                      <button
                        data-nav-item="true"
                        tabIndex={0}
                        onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, delaySeconds: 0 })}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: '#10151f',
                          border: '1px solid #2d3852',
                          color: '#94a3b8',
                          fontSize: '0.85rem'
                        }}
                      >
                        Reset Sync
                      </button>

                      <button
                        data-nav-item="true"
                        tabIndex={0}
                        onClick={() => onUpdateSubtitleSettings({ ...subtitleSettings, delaySeconds: Number((subtitleSettings.delaySeconds + 0.5).toFixed(1)) })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: '#10151f',
                          border: '1px solid #2d3852',
                          color: '#f8fafc',
                          fontSize: '0.85rem'
                        }}
                      >
                        <Plus size={16} /> 0.5s Later
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: AUDIO LANGUAGES */}
          {activeTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                DETECTED AUDIO TRACKS
              </label>

              {audioTracks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {audioTracks.map((track) => (
                    <button
                      key={track.id}
                      data-nav-item="true"
                      tabIndex={0}
                      onClick={() => onSelectAudioTrack(track.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '10px',
                        border: selectedAudioTrackId === track.id ? '2px solid #38bdf8' : '1px solid #2d3852',
                        background: selectedAudioTrackId === track.id ? 'rgba(56, 189, 248, 0.15)' : '#10151f',
                        color: selectedAudioTrackId === track.id ? '#38bdf8' : '#f8fafc',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      <span>{track.label || `Audio Track (${track.language || 'Default'})`}</span>
                      {selectedAudioTrackId === track.id && <Check size={20} />}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: '#10151f',
                    border: '1px solid #2d3852',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                >
                  <p style={{ margin: '0 0 10px 0', color: '#f8fafc', fontWeight: 600 }}>
                    Dual-Audio & Multi-Language MKVs:
                  </p>
                  <p style={{ margin: '0 0 8px 0' }}>
                    Web browsers decode only the primary audio stream from `.mkv` files because browsers lack full Matroska container demuxers.
                  </p>
                  <p style={{ margin: 0, color: '#38bdf8' }}>
                    💡 <strong>On Android TV:</strong> When running the native TV app (or launching VLC via the External App tab), all multi-audio tracks (Hindi, English, etc.) and AC3/DTS surround sound play natively with full track switching.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXTERNAL APP */}
          {activeTab === 'external' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: '#10151f',
                  border: '1px solid #2d3852',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontWeight: 700, fontSize: '1.05rem' }}>
                  <Tv size={22} color="#38bdf8" />
                  <span>Play in External TV Player (VLC / Just Player)</span>
                </div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  If your video has specialized anime subtitles (.ass/.ssa) or high-fidelity multi-channel surround sound (Dolby Atmos / DTS-HD / AC3), you can launch it directly in VLC or Nova Video Player with full hardware acceleration.
                </p>

                <button
                  data-nav-item="true"
                  tabIndex={0}
                  onClick={handleLaunchExternal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#38bdf8',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '1rem',
                    marginTop: '8px'
                  }}
                >
                  <ExternalLink size={20} />
                  <span>Open Video in VLC / External Player</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

