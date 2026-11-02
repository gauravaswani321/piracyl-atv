import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Subtitles,
  Languages,
  Tv,
  Loader2
} from 'lucide-react';
import { DriveFile, WorkerConfig } from '../types/drive';
import { savePlaybackProgress, getPlaybackProgress } from '../services/videoPlayerService';
import {
  SubtitleTrack,
  SubtitleSettings,
  DEFAULT_SUBTITLE_SETTINGS,
  findSiblingSubtitles,
  loadSubtitleAsVttBlob
} from '../services/subtitleService';
import { TrackSettingsModal } from './TrackSettingsModal';
import { launchExternalTVPlayer, isNativeTVBridgeAvailable } from '../services/nativePlayer';

interface VideoPlayerViewProps {
  file: DriveFile;
  streamUrl: string;
  config: WorkerConfig;
  allFolderFiles?: DriveFile[];
  onClose: () => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  file,
  streamUrl,
  config,
  allFolderFiles = [],
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subtitle & Audio Track States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);
  const [audioTracks, setAudioTracks] = useState<Array<{ id: string; label: string; language: string; enabled: boolean }>>([]);
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(null);

  // Find any subtitle files in the same folder (.srt, .vtt)
  const siblingSubFiles = useMemo(() => {
    return findSiblingSubtitles(file, allFolderFiles);
  }, [file, allFolderFiles]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isTrackModalOpen) {
        setShowControls(false);
      }
    }, 4500);
  }, [isPlaying, isTrackModalOpen]);

  // Initial scan for embedded textTracks and audioTracks
  const scanMediaTracks = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Scan TextTracks (Subtitles)
    const subList: SubtitleTrack[] = [];
    if (video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const t = video.textTracks[i];
        subList.push({
          id: `embedded-${i}`,
          label: t.label || `Subtitle Track ${i + 1} (${t.language || 'und'})`,
          language: t.language || 'und',
          src: ''
        });
      }
    }
    setSubtitleTracks((prev) => {
      // keep dynamically added ones
      const externalOnly = prev.filter((p) => p.isExternal);
      return [...subList, ...externalOnly];
    });

    // Scan AudioTracks
    const mediaAudioTracks = (video as any).audioTracks;
    if (mediaAudioTracks && mediaAudioTracks.length > 0) {
      const aList = [];
      let activeId = null;
      for (let i = 0; i < mediaAudioTracks.length; i++) {
        const at = mediaAudioTracks[i];
        const atId = at.id || String(i);
        if (at.enabled) activeId = atId;
        aList.push({
          id: atId,
          label: at.label || `Audio Track ${i + 1} (${at.language || 'Default'})`,
          language: at.language || 'und',
          enabled: at.enabled
        });
      }
      setAudioTracks(aList);
      if (activeId) setSelectedAudioTrackId(activeId);
    }
  }, []);

  const isMkvOrDolby = useMemo(() => {
    return (
      (file.name || '').toLowerCase().endsWith('.mkv') ||
      /(ddp|ac3|dts|5\.1|7\.1|atmos|truehd|eac3)/i.test(file.name || '')
    );
  }, [file.name]);

  const handleSwitchToVLC = () => {
    const currentPos = videoRef.current ? videoRef.current.currentTime : 0;
    launchExternalTVPlayer(streamUrl, file.name, '', currentPos);
    if (!isNativeTVBridgeAvailable()) {
      setToastNotice('Stream URL copied to clipboard! In VLC: Media -> Open Network Stream -> Paste.');
      setTimeout(() => setToastNotice(null), 6000);
      return;
    }
    onClose();
  };

  // Initial resume seek and track detection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      scanMediaTracks();

      const saved = getPlaybackProgress(file.id);
      if (saved && saved.currentTime > 5 && saved.currentTime < (video.duration - 15)) {
        video.currentTime = saved.currentTime;
      }
      video.muted = false; video.volume = 1.0; setIsMuted(false); video.play().catch((err) => { console.log('Unmuted autoplay blocked:', err); video.muted = true; setIsMuted(true); video.play().catch((e) => console.error('Play failed:', e)); });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime > 0 && Math.floor(video.currentTime) % 5 === 0) {
        savePlaybackProgress(file.id, video.currentTime, video.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setBuffering(false);
      resetHideTimer();
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
      savePlaybackProgress(file.id, video.currentTime, video.duration);
    };

    const handleLoadStart = () => setBuffering(true);
    const handleWaiting = () => setBuffering(true);
    const handleSeeking = () => setBuffering(true);
    const handleSeeked = () => setBuffering(false);
    const handleCanPlay = () => setBuffering(false);
    const handlePlaying = () => {
      setBuffering(false);
      setErrorMessage(null);
    };

    const handleError = () => {
      const err = video.error;
      console.error('HTML5 Video Error:', err);
      setBuffering(false);
      if (err) {
        if (err.code === 4) {
          setErrorMessage(
            'The browser cannot decode this MKV video format or audio codec (e.g. AC3/DTS/DDP). Use the "Open in VLC" button below or test on Android TV where ExoPlayer plays all MKV formats natively.'
          );
        } else {
          setErrorMessage(`Playback error (code ${err.code}): ${err.message || 'Media stream failed'}`);
        }
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
      if (video.duration > 0) {
        savePlaybackProgress(file.id, video.currentTime, video.duration);
      }
    };
  }, [file.id, resetHideTimer, scanMediaTracks]);

  // Handle switching Subtitles
  const handleSelectSubtitle = useCallback((trackId: string | null) => {
    const video = videoRef.current;
    if (!video) return;

    setSelectedSubtitleId(trackId);

    // Disable all text tracks first
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = 'disabled';
    }

    if (trackId === null) return;

    // Enable selected track
    if (trackId.startsWith('embedded-')) {
      const idx = parseInt(trackId.replace('embedded-', ''), 10);
      if (video.textTracks[idx]) {
        video.textTracks[idx].mode = 'showing';
      }
    } else {
      // Find track element by id
      const trackElem = video.querySelector<HTMLTrackElement>(`track[data-track-id="${trackId}"]`);
      if (trackElem && trackElem.track) {
        trackElem.track.mode = 'showing';
      }
    }
  }, []);

  // Handle loading sibling subtitle from folder (.srt / .vtt)
  const handleLoadSiblingSubtitle = async (subFile: DriveFile) => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setBuffering(true);
      const vttUrl = await loadSubtitleAsVttBlob(config, subFile);
      const trackId = `sibling-${subFile.id || Date.now()}`;

      // Check if already in track elements
      let trackEl = video.querySelector<HTMLTrackElement>(`track[data-track-id="${trackId}"]`);
      if (!trackEl) {
        trackEl = document.createElement('track');
        trackEl.kind = 'subtitles';
        trackEl.label = subFile.name;
        trackEl.srclang = 'en';
        trackEl.src = vttUrl;
        trackEl.setAttribute('data-track-id', trackId);
        video.appendChild(trackEl);
      }

      setSubtitleTracks((prev) => {
        if (prev.some((t) => t.id === trackId)) return prev;
        return [
          ...prev,
          {
            id: trackId,
            label: subFile.name,
            src: vttUrl,
            language: 'en',
            isExternal: true
          }
        ];
      });

      handleSelectSubtitle(trackId);
    } catch (err) {
      console.error('Failed to load sibling subtitle', err);
    } finally {
      setBuffering(false);
    }
  };

  // Handle switching Audio Tracks
  const handleSelectAudioTrack = (trackId: string) => {
    const video = videoRef.current;
    if (!video) return;

    const mediaAudioTracks = (video as any).audioTracks;
    if (!mediaAudioTracks) return;

    for (let i = 0; i < mediaAudioTracks.length; i++) {
      const at = mediaAudioTracks[i];
      const atId = at.id || String(i);
      at.enabled = atId === trackId;
    }
    setSelectedAudioTrackId(trackId);
  };

  // Android TV Remote Control Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetHideTimer();
      const video = videoRef.current;
      if (!video) return;

      // When modal is open, let modal handle its own navigation
      if (isTrackModalOpen) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 27 || e.keyCode === 4) {
          e.preventDefault();
          e.stopPropagation();
          setIsTrackModalOpen(false);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
        case 'Backspace':
        case 'BrowserBack':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;

        case ' ':
        case 'Enter':
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;

        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;

        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;

        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;

        case 'c':
        case 'C':
        case 's':
        case 'S':
          e.preventDefault();
          setIsTrackModalOpen(true);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [onClose, resetHideTimer, isTrackModalOpen]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => {
        console.warn('Playback play() failed:', err);
      });
    } else {
      video.pause();
    }
  };

  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Compute CSS for Subtitles (::cue)
  const fontSizes = {
    small: '1.4rem',
    medium: '1.9rem',
    large: '2.5rem',
    xlarge: '3.2rem'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {/* Dynamic Subtitle Style Injection for ::cue */}
      <style>{`
        video::cue {
          font-size: ${fontSizes[subtitleSettings.fontSize]} !important;
          color: ${subtitleSettings.color} !important;
          background-color: ${subtitleSettings.backgroundColor} !important;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
          font-weight: 600 !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0,0,0,0.8) !important;
          line-height: 1.4 !important;
        }
      `}</style>

      {/* Video Tag */}
      <video
        ref={videoRef}
        src={streamUrl}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />

      {/* Playback Error Overlay */}
      {errorMessage && (
        <div
          style={{
            position: 'absolute',
            zIndex: 95,
            maxWidth: '560px',
            background: 'rgba(21, 27, 40, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}
        >
          <div style={{ color: '#f87171', fontWeight: 700, fontSize: '1.2rem' }}>
            Playback Issue
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {errorMessage}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={handleSwitchToVLC}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              <Tv size={18} />
              <span>Open in VLC / External Player</span>
            </button>
            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={onClose}
              style={{
                padding: '12px 20px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Buffering Spinner */}
      {buffering && !errorMessage && (
        <div
          style={{
            position: 'absolute',
            zIndex: 60,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            padding: '24px 32px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
          }}
        >
          <Loader2
            size={48}
            color="#38bdf8"
            className="spin-loader"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.7))'
            }}
          />
          <span
            style={{
              color: '#f8fafc',
              fontSize: '0.95rem',
              fontWeight: 600,
              letterSpacing: '0.04em'
            }}
          >
            Buffering...
          </span>
        </div>
      )}

      {/* Overlay UI (Top and Bottom Controls) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 40px',
          background: showControls
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.92) 100%)'
            : 'transparent',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      >
        {/* Top Bar: Back, File Name & External TV Player Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <ArrowLeft size={24} />
            </button>

            <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
              {file.name}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={handleSwitchToVLC}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid #38bdf8',
                background: 'rgba(56, 189, 248, 0.2)',
                backdropFilter: 'blur(8px)',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <Tv size={18} />
              <span>Switch to VLC (Dolby Audio & 4K)</span>
            </button>

            <button
              data-nav-item="true"
              tabIndex={0}
              onClick={() => setIsTrackModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <Subtitles size={18} />
              <span>Audio & Subtitle Settings</span>
            </button>
          </div>
        </div>

        {/* Center Toast or Browser Dolby Audio Notice */}
        {toastNotice && (
          <div
            style={{
              alignSelf: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #38bdf8',
              borderRadius: '12px',
              padding: '14px 28px',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 90
            }}
          >
            <span>{toastNotice}</span>
          </div>
        )}

        {isMkvOrDolby && !isNativeTVBridgeAvailable() && !toastNotice && (
          <div
            style={{
              alignSelf: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              borderRadius: '12px',
              padding: '10px 22px',
              color: '#fef08a',
              fontSize: '0.88rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: '680px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
            }}
          >
            <span>⚠️ <strong>MKV / Dolby Audio Notice:</strong> Web browsers do not support Dolby/DTS audio codecs. For sound, use the Android TV APK (ExoPlayer/VLC) or click &ldquo;Switch to VLC&rdquo; to play in VLC on PC.</span>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Timeline Scrubber */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              if (videoRef.current && duration > 0) {
                videoRef.current.currentTime = pos * duration;
              }
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: '#38bdf8',
                borderRadius: '4px',
                boxShadow: '0 0 10px #38bdf8'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff'
            }}
          >
            {/* Play/Pause & Seek buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                data-nav-item="true"
                tabIndex={0}
                onClick={togglePlay}
                style={{
                  background: '#38bdf8',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a'
                }}
              >
                {isPlaying ? <Pause size={24} fill="#0f172a" /> : <Play size={24} fill="#0f172a" />}
              </button>

              <button
                data-nav-item="true"
                tabIndex={0}
                onClick={() => seekRelative(-10)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <RotateCcw size={20} />
              </button>

              <button
                data-nav-item="true"
                tabIndex={0}
                onClick={() => seekRelative(10)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <RotateCw size={20} />
              </button>

              {/* Time display */}
              <div style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '8px', color: '#cbd5e1' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right: Subtitles (CC), Audio, Mute */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Subtitles Button */}
              <button
                data-nav-item="true"
                tabIndex={0}
                onClick={() => setIsTrackModalOpen(true)}
                title="Subtitles & Captions"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: selectedSubtitleId !== null ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.2)',
                  background: selectedSubtitleId !== null ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedSubtitleId !== null ? '#38bdf8' : '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <Subtitles size={18} />
                <span>{selectedSubtitleId !== null ? 'Subtitles ON' : 'CC'}</span>
              </button>

              {/* Audio Languages Button */}
              <button
                data-nav-item="true"
                tabIndex={0}
                onClick={() => setIsTrackModalOpen(true)}
                title="Audio Languages"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <Languages size={18} />
                <span>Audio</span>
              </button>

              {/* Audio Mute */}
              <button
                data-nav-item="true"
                tabIndex={0}
                onClick={toggleMute}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Track & Subtitle Settings Dialog */}
      <TrackSettingsModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        subtitleTracks={subtitleTracks}
        selectedSubtitleId={selectedSubtitleId}
        onSelectSubtitle={handleSelectSubtitle}
        subtitleSettings={subtitleSettings}
        onUpdateSubtitleSettings={setSubtitleSettings}
        siblingSubFiles={siblingSubFiles}
        onLoadSiblingSubtitle={handleLoadSiblingSubtitle}
        audioTracks={audioTracks}
        selectedAudioTrackId={selectedAudioTrackId}
        onSelectAudioTrack={handleSelectAudioTrack}
        streamUrl={streamUrl}
        fileName={file.name}
      />
    </div>
  );
};
