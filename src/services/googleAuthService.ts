import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

class GoogleAuthService {
    private initialized = false;

    async initialize() {
        if (this.initialized) {
            console.log('GoogleAuth already initialized, skipping...');
            return;
        }

        try {
            // Only initialize on web platform
            // For native Android, initialization happens automatically via capacitor.config.ts
            if (!Capacitor.isNativePlatform()) {
                await GoogleAuth.initialize({
                    clientId: '884107338123-00mgjgsask7h7asis26gaq3oc3tvorgd.apps.googleusercontent.com',
                    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
                    grantOfflineAccess: true,
                });
            }
            this.initialized = true;
            console.log('GoogleAuth initialized successfully');
        } catch (error) {
            console.error('Failed to initialize GoogleAuth', error);
            throw error;
        }
    }

    isInitialized() {
        return this.initialized;
    }
}

export const googleAuthService = new GoogleAuthService();
