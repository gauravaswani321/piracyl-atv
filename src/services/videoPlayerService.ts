import { Capacitor } from '@capacitor/core';
import { VideoPlayer } from '@capgo/capacitor-video-player';
import { DriveFile, PlaybackProgress } from '../types/drive';

const PROGRESS_PREFIX = 'piracyl_progress_';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const savePlaybackProgress = (fileId: string, currentTime: number, duration: number): void => {
  if (!fileId || duration <= 0) return;
  const progress: PlaybackProgress = {
    fileId,
    currentTime,
    duration,
    lastPlayed: Date.now()
  };
  localStorage.setItem(PROGRESS_PREFIX + fileId, JSON.stringify(progress));
};

export const getPlaybackProgress = (fileId: string): PlaybackProgress | null => {
  const data = localStorage.getItem(PROGRESS_PREFIX + fileId);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export interface LaunchPlayerOptions {
  url: string;
  title: string;
  file: DriveFile;
  onExit?: () => void;
}

/**
 * Launch playback using native ExoPlayer on Android TV or return false to indicate HTML5 fallback.
 */
export const launchNativePlayer = async (options: LaunchPlayerOptions): Promise<boolean> => {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    const saved = getPlaybackProgress(options.file.id);
    const startPosition = saved && saved.currentTime > 5 && saved.currentTime < (saved.duration - 15)
      ? saved.currentTime
      : 0;

    const res = await VideoPlayer.initPlayer({
      mode: 'fullscreen',
      url: options.url,
      playerId: 'tvPlayer',
      componentTag: 'div',
      title: options.title,
      pipEnabled: false,
      bkmodeEnabled: false,
      showControls: true,
      chromecast: false
    });

    console.log('Native ExoPlayer launched:', res);

    if (startPosition > 0) {
      setTimeout(async () => {
        try {
          await VideoPlayer.setCurrentTime({
            playerId: 'tvPlayer',
            seektime: startPosition
          });
        } catch (e) {
          console.warn('Seek error in native player', e);
        }
      }, 500);
    }

    return true;
  } catch (err) {
    console.warn('Native player failed or not available, falling back to Web player:', err);
    return false;
  }
};
