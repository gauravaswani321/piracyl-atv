export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string | number;
  link: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  path: string;
}

export interface WorkerConfig {
  baseUrl: string;
  rootPath: string; // e.g. "0:/"
  siteName: string;
  playerEngine?: 'vlc' | 'web' | 'ask';
}

export type FileCategory = 'video' | 'folder' | 'audio' | 'image' | 'other';

export interface PlaybackProgress {
  fileId: string;
  currentTime: number;
  duration: number;
  lastPlayed: number;
}

