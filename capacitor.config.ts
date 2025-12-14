import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sniper.buildflow',
  appName: 'Sniper Build Flow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://thesniper.onrender.com',
      'https://sniper-rptn.onrender.com',
      'https://accounts.google.com',
      'https://*.googleapis.com'
    ],
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '574103669256-2ttr5rardo4hb871r1bih8pufarleigo.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
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
