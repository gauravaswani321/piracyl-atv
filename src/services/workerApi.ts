import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { DriveFile, WorkerConfig } from '../types/drive';

const DEFAULT_CONFIG_KEY = 'piracyl_worker_config';

export const getStoredConfig = (): WorkerConfig => {
  const saved = localStorage.getItem(DEFAULT_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    baseUrl: 'https://gdrive.gauravaswani.workers.dev',
    rootPath: '0:/',
    siteName: 'PiracyL ATV',
    playerEngine: 'ask'
  };
};

export const saveStoredConfig = (config: WorkerConfig): void => {
  // Strip trailing slashes from baseUrl
  const cleaned: WorkerConfig = {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, '')
  };
  localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(cleaned));
};

export const getFileCategory = (file: DriveFile): 'folder' | 'video' | 'audio' | 'image' | 'other' => {
  const mime = (file.mimeType || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (mime === 'application/vnd.google-apps.folder' || mime.includes('folder')) {
    return 'folder';
  }
  if (
    mime.startsWith('video/') ||
    name.endsWith('.mkv') ||
    name.endsWith('.mp4') ||
    name.endsWith('.webm') ||
    name.endsWith('.avi') ||
    name.endsWith('.mov') ||
    name.endsWith('.ts')
  ) {
    return 'video';
  }
  if (mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.flac') || name.endsWith('.m4a')) {
    return 'audio';
  }
  if (mime.startsWith('image/')) {
    return 'image';
  }
  return 'other';
};

export const formatFileSize = (bytesOrStr: string | number): string => {
  if (typeof bytesOrStr === 'string' && isNaN(Number(bytesOrStr))) {
    return bytesOrStr;
  }
  const bytes = Number(bytesOrStr);
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

export const fetchFolderContents = async (
  config: WorkerConfig,
  folderPath: string,
  pageIndex: number = 0,
  password: string = ''
): Promise<{ files: DriveFile[]; nextPageToken?: string }> => {
  // Normalize folder path: ensure it doesn't double-slash
  let relPath = folderPath.trim();
  if (!relPath.startsWith('/')) {
    relPath = '/' + relPath;
  }

  const url = `${config.baseUrl}${relPath}`;

  try {
    // On Native Android TV (Capacitor), route through native HTTP engine to bypass CORS
    if (Capacitor.isNativePlatform()) {
      const nativeRes = await CapacitorHttp.post({
        url,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        data: {
          page_index: pageIndex,
          password: password
        }
      });
      const json = typeof nativeRes.data === 'string' ? JSON.parse(nativeRes.data) : nativeRes.data;
      const files: DriveFile[] = json?.data?.files || [];
      return {
        files,
        nextPageToken: json?.data?.nextPageToken
      };
    }

    // In web browser (localhost:3000), use 'text/plain' to avoid triggering an OPTIONS preflight request.
    // The GDI-JS Cloudflare Worker parses JSON body and responds with 'Access-Control-Allow-Origin: *'.
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        page_index: pageIndex,
        password: password
      })
    });

    if (!res.ok) {
      throw new Error(`Worker returned status ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const files: DriveFile[] = json?.data?.files || [];
    return {
      files,
      nextPageToken: json?.data?.nextPageToken
    };
  } catch (err: any) {
    console.error('fetchFolderContents error:', err);
    throw err;
  }
};

export const getStreamUrl = (config: WorkerConfig, file: DriveFile): string => {
  let link = file.link || '';
  if (!link.startsWith('http://') && !link.startsWith('https://')) {
    if (!link.startsWith('/')) {
      link = '/' + link;
    }
    link = `${config.baseUrl}${link}`;
  }

  // Do not modify query parameters if the URL is HMAC-signed with mac= (GDI-JS signature)
  if (!link.includes('mac=') && !link.includes('inline=')) {
    const separator = link.includes('?') ? '&' : '?';
    link = `${link}${separator}inline=true`;
  }
  return link;
};

