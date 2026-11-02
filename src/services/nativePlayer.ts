import { Capacitor } from '@capacitor/core';

/**
 * Checks if the native TV Android player bridge is available
 */
export const isNativeTVBridgeAvailable = (): boolean => {
  return typeof (window as any).TVPlayerBridge !== 'undefined';
};

/**
 * Launches the in-app hardware-accelerated ExoPlayer Activity with zero jitter and Dolby passthrough
 */
export const launchNativeExoPlayer = (
  url: string,
  title: string = '',
  fileId: string = '',
  positionSeconds: number = 0
): boolean => {
  const positionMs = Math.max(0, Math.round(positionSeconds * 1000));

  if (isNativeTVBridgeAvailable() && typeof (window as any).TVPlayerBridge?.launchExoPlayer === 'function') {
    try {
      (window as any).TVPlayerBridge.launchExoPlayer(url, title, fileId, positionMs);
      return true;
    } catch (e) {
      console.error('TVPlayerBridge.launchExoPlayer error:', e);
    }
  }
  return false;
};

/**
 * Launches the video URL into VLC, Just Player, or system default player with full hardware acceleration
 * and complete multi-channel AC3/EAC3/DTS audio decoding.
 */
export const launchExternalTVPlayer = (
  url: string,
  title: string = '',
  subtitleUrl: string = '',
  positionSeconds: number = 0
): boolean => {
  const positionMs = Math.max(0, Math.round(positionSeconds * 1000));

  if (isNativeTVBridgeAvailable() && typeof (window as any).TVPlayerBridge?.launchExternalPlayer === 'function') {
    try {
      (window as any).TVPlayerBridge.launchExternalPlayer(url, title, subtitleUrl, positionMs);
      return true;
    } catch (e) {
      console.error('TVPlayerBridge.launchExternalPlayer error:', e);
    }
  }

  // Fallback for Android browser or desktop
  try {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${cleanUrl}#Intent;action=android.intent.action.VIEW;type=video/*;end;`;
    window.location.href = intentUrl;
    return true;
  } catch {
    window.open(url, '_blank');
    return false;
  }
};
