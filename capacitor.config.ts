import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sniper.buildflow',
  appName: 'Sniper Build Flow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://thesniper.onrender.com',
      'https://sniperserver.onrender.com',
      'https://accounts.google.com',
      'https://*.googleapis.com'
    ],
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      spinnerColor: "#0066cc"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: "#ffffff"
    }
  }
};

export default config;
