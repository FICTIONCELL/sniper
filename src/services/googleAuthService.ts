import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

import { GOOGLE_CLIENT_ID } from '@/config';

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
                    clientId: GOOGLE_CLIENT_ID,
                    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
                    grantOfflineAccess: true,
                });
            }
            this.initialized = true;
            console.log('GoogleAuth initialized successfully');
        } catch (error) {
            console.error('Failed to initialize GoogleAuth', error);
            // Don't throw, just log
        }
    }

    async signIn() {
        if (!this.initialized) {
            await this.initialize();
        }
        return await GoogleAuth.signIn();
    }

    async signOut() {
        return await GoogleAuth.signOut();
    }

    isInitialized() {
        return this.initialized;
    }
}

export const googleAuthService = new GoogleAuthService();
