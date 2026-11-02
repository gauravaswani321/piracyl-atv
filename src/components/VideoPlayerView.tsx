import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';
import { DriveFile } from '../types/drive';
import { savePlaybackProgress, getPlaybackProgress } from '../services/videoPlayerService';

interface VideoPlayerViewProps {
  file: DriveFile;
  streamUrl: string;
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

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  }, [isPlaying]);

  // Initial resume seek
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const saved = getPlaybackProgress(file.id);
      if (saved && saved.currentTime > 5 && saved.currentTime < (video.duration - 15)) {
        video.currentTime = saved.currentTime;
      }
      video.play().catch((err) => console.log('Autoplay policy caught:', err));
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // save progress every 5 seconds
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

    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => setBuffering(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      if (video.duration > 0) {
        savePlaybackProgress(file.id, video.currentTime, video.duration);
      }
    };
  }, [file.id, resetHideTimer]);

  // Android TV Remote Control Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetHideTimer();
      const video = videoRef.current;
      if (!video) return;

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
          // Seek forward 10s
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;

        case 'ArrowLeft':
          // Seek back 10s
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;

        case 'ArrowUp':
          // Volume up
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;

        case 'ArrowDown':
          // Volume down
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
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
  }, [onClose, resetHideTimer]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
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

      {/* Buffering Spinner */}
      {buffering && (
        <div
          style={{
            position: 'absolute',
            width: '64px',
            height: '64px',
            border: '5px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: '#38bdf8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
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
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.9) 100%)'
            : 'transparent',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      >
        {/* Top Bar: Back & File Name */}
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

            {/* Right: Audio Mute */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
    </div>
  );
};

