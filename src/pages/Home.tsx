import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { DriveFile, DriveFolder, WorkerConfig } from '../types/drive';
import {
  getStoredConfig,
  saveStoredConfig,
  fetchFolderContents,
  getStreamUrl
} from '../services/workerApi';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { HeaderBar } from '../components/HeaderBar';
import { VideoGrid } from '../components/VideoGrid';
import { VideoPlayerView } from '../components/VideoPlayerView';
import { SettingsModal } from '../components/SettingsModal';
import { PlayerChoiceModal } from '../components/PlayerChoiceModal';
import { launchExternalTVPlayer } from '../services/nativePlayer';

export const Home: React.FC = () => {
  const [config, setConfig] = useState<WorkerConfig>(getStoredConfig);
  const [currentFolder, setCurrentFolder] = useState<DriveFolder>({
    id: 'root',
    name: '',
    path: config.rootPath || '0:/'
  });
  const [folderHistory, setFolderHistory] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<{ file: DriveFile; streamUrl: string } | null>(null);
  const [selectedFileForChoice, setSelectedFileForChoice] = useState<DriveFile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load contents of current folder
  const loadFolder = useCallback(async (folderPath: string) => {
    setLoading(true);
    try {
      const res = await fetchFolderContents(config, folderPath);
      setFiles(res.files);
    } catch (err) {
      console.error('Error fetching folder:', err);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadFolder(currentFolder.path);
  }, [currentFolder.path, loadFolder]);

  // Handle folder navigation
  const handleFolderSelect = (folderFile: DriveFile) => {
    setFolderHistory((prev) => [...prev, currentFolder]);
    const base = currentFolder.path.endsWith('/') ? currentFolder.path : `${currentFolder.path}/`;
    const folderName = folderFile.name.endsWith('/') ? folderFile.name : `${folderFile.name}/`;
    setCurrentFolder({
      id: folderFile.id,
      name: folderFile.name,
      path: folderFile.link || `${base}${folderName}`
    });
    setSearchQuery('');
  };

  const handleNavigateUp = useCallback(() => {
    if (folderHistory.length === 0) return;
    const previous = folderHistory[folderHistory.length - 1];
    setFolderHistory((prev) => prev.slice(0, -1));
    setCurrentFolder(previous);
    setSearchQuery('');
  }, [folderHistory]);

  const startPlayback = (file: DriveFile, engine: 'vlc' | 'web') => {
    const streamUrl = getStreamUrl(config, file);
    if (engine === 'vlc') {
      launchExternalTVPlayer(streamUrl, file.name);
    } else {
      setActiveVideo({ file, streamUrl });
    }
  };

  // Handle Video Selection - prompts or launches according to preference
  const handleFileSelect = (file: DriveFile) => {
    const engine = config.playerEngine || 'ask';
    if (engine === 'vlc') {
      startPlayback(file, 'vlc');
    } else if (engine === 'web') {
      startPlayback(file, 'web');
    } else {
      setSelectedFileForChoice(file);
    }
  };

  const handleChoice = (engine: 'vlc' | 'web', remember: boolean) => {
    if (!selectedFileForChoice) return;
    const file = selectedFileForChoice;
    setSelectedFileForChoice(null);

    if (remember) {
      const updated = { ...config, playerEngine: engine };
      setConfig(updated);
      saveStoredConfig(updated);
    }

    startPlayback(file, engine);
  };

  // Back button handling
  const handleBack = useCallback(() => {
    if (activeVideo) {
      setActiveVideo(null);
      return;
    }
    if (selectedFileForChoice) {
      setSelectedFileForChoice(null);
      return;
    }
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return;
    }
    if (folderHistory.length > 0) {
      handleNavigateUp();
      return;
    }
  }, [activeVideo, selectedFileForChoice, isSettingsOpen, folderHistory.length, handleNavigateUp]);

  // Spatial Navigation for TV Remote
  useSpatialNavigation({
    active: !activeVideo,
    onBack: handleBack
  });

  // Filter files by search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => (f.name || '').toLowerCase().includes(q));
  }, [files, searchQuery]);

  return (
    <IonPage>
      <IonContent fullscreen style={{ '--background': '#0b0e14' }}>
        <HeaderBar
          currentFolder={currentFolder}
          folderHistory={folderHistory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNavigateUp={handleNavigateUp}
          onRefresh={() => loadFolder(currentFolder.path)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          loading={loading}
        />

        <VideoGrid
          files={filteredFiles}
          loading={loading}
          onFileSelect={handleFileSelect}
          onFolderSelect={handleFolderSelect}
        />

        {/* Video Player Modal/View */}
        {activeVideo && (
          <VideoPlayerView
            file={activeVideo.file}
            streamUrl={activeVideo.streamUrl}
            config={config}
            allFolderFiles={files}
            onClose={() => setActiveVideo(null)}
          />
        )}

        {/* Player Selection Choice Modal */}
        <PlayerChoiceModal
          isOpen={!!selectedFileForChoice}
          file={selectedFileForChoice}
          onSelectPlayer={handleChoice}
          onClose={() => setSelectedFileForChoice(null)}
        />

        {/* Settings Modal */}
        <SettingsModal
          config={config}
          isOpen={isSettingsOpen}
          onSave={(newConfig) => {
            setConfig(newConfig);
            saveStoredConfig(newConfig);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      </IonContent>
    </IonPage>
  );
};

