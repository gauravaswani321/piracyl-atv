import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.piracyl.atv',
  appName: 'PiracyL ATV',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorVideoPlayer: {
      // Configuration for video player
    }
  }
};

export default config;

