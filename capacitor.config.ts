import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aitherjamstudio.rvstrangers',
  appName: 'RVStrangers',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: false,
    },
  },
};

export default config;
