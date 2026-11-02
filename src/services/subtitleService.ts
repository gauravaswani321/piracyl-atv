import { DriveFile, WorkerConfig } from '../types/drive';
import { getStreamUrl } from './workerApi';

export interface SubtitleTrack {
  id: string;
  label: string;
  src: string;
  language: string;
  isExternal?: boolean;
}

export interface SubtitleSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  color: string;
  backgroundColor: string;
  delaySeconds: number;
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 'large',
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  delaySeconds: 0
};

/**
 * Converts SubRip (.srt) text to WebVTT (.vtt) format for HTML5 <track>
 */
export const srtToVtt = (srtText: string): string => {
  // Normalize line breaks
  let vtt = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Replace comma in timestamps: 00:01:23,456 --> 00:01:25,789
  vtt = vtt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  return `WEBVTT\n\n${vtt}`;
};

/**
 * Searches sibling files in the same folder for matching .srt or .vtt subtitle files
 */
export const findSiblingSubtitles = (
  videoFile: DriveFile,
  allFiles: DriveFile[]
): DriveFile[] => {
  const baseName = videoFile.name.substring(0, videoFile.name.lastIndexOf('.')) || videoFile.name;
  const cleanBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');

  return allFiles.filter((f) => {
    const name = f.name.toLowerCase();
    const isSubExt = name.endsWith('.srt') || name.endsWith('.vtt');
    if (!isSubExt) return false;

    // Check if subtitle name matches video or contains video keywords or common sub names
    const cleanSub = name.replace(/[^a-z0-9]/g, '');
    return (
      cleanSub.includes(cleanBase) ||
      cleanBase.includes(cleanSub.replace(/srt|vtt|sub|eng|hindi/g, '')) ||
      name.includes('sub') ||
      name.includes('eng')
    );
  });
};

/**
 * Fetches an external .srt from worker, converts to WebVTT Blob URL
 */
export const loadSubtitleAsVttBlob = async (
  config: WorkerConfig,
  file: DriveFile
): Promise<string> => {
  const streamUrl = getStreamUrl(config, file);
  try {
    const res = await fetch(streamUrl);
    const text = await res.text();
    const vtt = file.name.toLowerCase().endsWith('.vtt') ? text : srtToVtt(text);
    const blob = new Blob([vtt], { type: 'text/vtt' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to load subtitle:', err);
    throw err;
  }
};

