import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google'; // Keep for web logout if needed, or replace
import { googleDriveService } from '@/services/googleDriveService';
import { autoLoadProfileOnLogin } from '@/services/profileAutoLoadService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
import { GOOGLE_CLIENT_ID } from '@/config';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { googleAuthService } from '@/services/googleAuthService';

interface GoogleDriveContextType {
    isAuthenticated: boolean;
    user: any | null;
    userEmail: string | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    syncData: () => Promise<void>;
    loadData: () => Promise<void>;
    isSyncing: boolean;
    pendingSync: boolean;
    lastSynced: Date | null;
    uploadDocument: (file: File | Blob, fileName: string, projectId: string) => Promise<void>;
    getDocuments: (projectId?: string) => Promise<any[]>;
    uploadReservePhoto: (file: File | Blob, projectId: string, reserveId: string) => Promise<any>;
    accessToken: string | null;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingSync, setPendingSync] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    const { toast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        // Initialize Google Auth using centralized service (only once)
        googleAuthService.initialize().catch(err => {
            console.error('Failed to initialize Google Auth in GoogleDriveContext', err);
        });
    }, []);

    const fetchUserInfo = async (token: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.email) {
                setUserEmail(data.email);
            }
        } catch (error) {
            console.error("Failed to fetch user info", error);
        }
    };

    // Restore session after page reload (for load data flow)
    useEffect(() => {
        const tempToken = sessionStorage.getItem('sniper_temp_token');
        const tempEmail = sessionStorage.getItem('sniper_temp_user_email');

        if (tempToken) {
            // Restore the session
            setAccessToken(tempToken);
            setUser(true);
            if (tempEmail) {
                setUserEmail(tempEmail);
            }

            // Clear the temporary storage
            sessionStorage.removeItem('sniper_temp_token');
            sessionStorage.removeItem('sniper_temp_user_email');

            toast({
                title: "Session restaurée",
                description: "Vos données ont été chargées avec succès.",
            });
        }
    }, []);

    const clearLocalData = () => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sniper_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('sniper_device_id');
    };

    const getAllLocalStorageData = () => {
        const data: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sniper_')) {
                try {
                    data[key] = JSON.parse(localStorage.getItem(key) || 'null');
                } catch (e) {
                    data[key] = localStorage.getItem(key);
                }
            }
        }
        return data;
    };

    const mergeData = (local: any, remote: any) => {
        const merged = { ...local, ...remote };

        if (local.sniper_devices && remote.sniper_devices) {
            const localDevices = Array.isArray(local.sniper_devices) ? local.sniper_devices : JSON.parse(local.sniper_devices);
            const remoteDevices = Array.isArray(remote.sniper_devices) ? remote.sniper_devices : JSON.parse(remote.sniper_devices);

            const deviceMap = new Map();
            [...remoteDevices, ...localDevices].forEach((d: any) => {
                deviceMap.set(d.deviceId, d);
            });

            merged.sniper_devices = Array.from(deviceMap.values());
        }
        return merged;
    };

    const syncData = async () => {
        if (!accessToken) return;
        setIsSyncing(true);
        try {
            const localData = getAllLocalStorageData();
            const file = await googleDriveService.findFile(accessToken);

            if (file) {
                await googleDriveService.updateFile(accessToken, file.id, localData);
            } else {
                await googleDriveService.createFile(accessToken, localData);
            }

            setLastSynced(new Date());
            toast({
                title: "Synchronisation réussie",
                description: "Vos données ont été sauvegardées sur Google Drive.",
                duration: 2000,
            });
        } catch (error) {
            console.error("Sync error", error);
            toast({
                title: "Erreur de synchronisation",
                description: "Impossible de sauvegarder les données.",
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const loadDataWithToken = async (token: string) => {
        setIsSyncing(true);
        try {
            // Step 1: Find file
            toast({
                title: "🔍 Recherche...",
                description: "Recherche de vos données sur Google Drive.",
                duration: 2000,
            });

            const file = await googleDriveService.findFile(token);
            if (!file) {
                toast({
                    title: "Aucune sauvegarde trouvée",
                    description: "Aucun fichier de données trouvé sur ce Drive.",
                });
                return;
            }

            // Step 2: Read file
            toast({
                title: "📥 Téléchargement...",
                description: "Téléchargement de vos données depuis le cloud.",
                duration: 2000,
            });

            const remoteData = await googleDriveService.readFile(token, file.id);
            const localData = getAllLocalStorageData();
            const mergedData = mergeData(localData, remoteData);

            // Step 3: Save to localStorage
            toast({
                title: "💾 Sauvegarde locale...",
                description: "Application de vos données.",
                duration: 2000,
            });

            Object.keys(mergedData).forEach(key => {
                if (typeof mergedData[key] === 'object') {
                    localStorage.setItem(key, JSON.stringify(mergedData[key]));
                } else {
                    localStorage.setItem(key, mergedData[key]);
                }
            });

            if (file) {
                await googleDriveService.updateFile(token, file.id, mergedData);
            }

            // Save the token to sessionStorage before reload to prevent disconnection
            sessionStorage.setItem('sniper_temp_token', token);
            sessionStorage.setItem('sniper_temp_user_email', userEmail || '');

            toast({
                title: "✅ Chargement terminé",
                description: "Redémarrage de l'application...",
                duration: 1500,
            });

            // Auto-load profile based on email
            if (userEmail) {
                try {
                    await autoLoadProfileOnLogin(token, userEmail);
                    toast({
                        title: "👤 Profil chargé",
                        description: "Votre profil partagé a été appliqué.",
                        duration: 2000
                    });
                } catch (e) {
                    console.log('No shared profile found, using local profile');
                }
            }

            // Trigger custom event to refresh all components without page reload
            window.dispatchEvent(new Event('sniper-data-loaded'));

            toast({
                title: "✅ Synchronisation terminée",
                description: "Vos données sont à jour.",
                duration: 2000,
            });

            setIsSyncing(false);

        } catch (error) {
            console.error("Load error", error);
            toast({
                title: "❌ Erreur de chargement",
                description: "Impossible de charger les données.",
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const checkForRemoteData = async (token: string) => {
        try {
            const file = await googleDriveService.findFile(token);
            if (file) {
                // Show notification that data is being loaded
                toast({
                    title: "📦 Chargement en cours...",
                    description: "Récupération de vos données depuis Google Drive.",
                    duration: 3000,
                });

                // Automatically load data
                await loadDataWithToken(token);
            }
        } catch (error) {
            console.error("Error checking for remote data", error);
        }
    };

    const login = async () => {
        try {
            const user = await GoogleAuth.signIn();

            // Handle both web and native response structures
            const token = user.authentication.accessToken;
            const email = user.email;

            setAccessToken(token);
            setUser(true);
            setUserEmail(email);

            toast({
                title: t('connected'),
                description: t('connectionStatus'),
            });

            checkForRemoteData(token);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            toast({
                title: t('error'),
                description: "Impossible de se connecter à Google.",
                variant: "destructive",
            });
        }
    };

    const logout = async () => {
        try {
            await GoogleAuth.signOut();
            setAccessToken(null);
            setUser(null);
            setUserEmail(null);
            clearLocalData();
            toast({
                title: t('disconnected'),
                description: "Vous avez été déconnecté. Les données locales ont été effacées.",
            });
            // Redirect to home page instead of reload
            window.location.href = '/';
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const loadData = async () => {
        if (!accessToken) return;
        await loadDataWithToken(accessToken);
    };

    // Auto-sync logic
    useEffect(() => {
        if (!accessToken) return;

        let timeoutId: NodeJS.Timeout;

        const handleDataChange = () => {
            setPendingSync(true);

            if (timeoutId) clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                syncData();
                setPendingSync(false);
            }, 5000);
        };

        window.addEventListener('sniper-data-change', handleDataChange);

        return () => {
            window.removeEventListener('sniper-data-change', handleDataChange);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [accessToken]); // Re-bind if auth changes

    const uploadDocument = async (file: File | Blob, fileName: string, projectId: string) => {
        if (!accessToken) return;
        setIsSyncing(true);
        try {
            // 1. Find or create "Sniper Documents" folder
            let folder = await googleDriveService.findFolder(accessToken, "Sniper Documents");
            if (!folder) {
                folder = await googleDriveService.createFolder(accessToken, "Sniper Documents");
            }

            // 2. Upload file with metadata
            const description = JSON.stringify({ projectId });
            await googleDriveService.uploadFile(accessToken, file, fileName, folder.id, description);

            toast({
                title: "Document uploadé",
                description: "Le document a été sauvegardé sur Google Drive.",
            });
        } catch (error) {
            console.error("Upload error", error);
            toast({
                title: "Erreur d'upload",
                description: "Impossible de sauvegarder le document.",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsSyncing(false);
        }
    };

    const getDocuments = async (projectId?: string) => {
        if (!accessToken) return [];
        try {
            const folder = await googleDriveService.findFolder(accessToken, "Sniper Documents");
            if (!folder) return [];

            const files = await googleDriveService.listFiles(accessToken, folder.id);

            // Filter by project if needed
            if (projectId) {
                return files.filter((f: any) => {
                    try {
                        const meta = JSON.parse(f.description || "{}");
                        return meta.projectId === projectId;
                    } catch (e) {
                        return false;
                    }
                });
            }

            return files;
        } catch (error) {
            console.error("List error", error);
            return [];
        }
    };

    const uploadReservePhoto = async (file: File | Blob, projectId: string, reserveId: string) => {
        if (!accessToken) return null;
        setIsSyncing(true);
        try {
            // 1. Root folder "Sniper Documents"
            const rootFolder = await googleDriveService.findOrCreateFolder(accessToken, "Sniper Documents");

            // 2. Project folder
            const projectFolder = await googleDriveService.findOrCreateFolder(accessToken, projectId, rootFolder.id);

            // 3. Reserve folder
            const reserveFolder = await googleDriveService.findOrCreateFolder(accessToken, reserveId, projectFolder.id);

            // 4. Upload file
            const fileName = `photo_${Date.now()}.jpg`;
            const uploadedFile = await googleDriveService.uploadFile(accessToken, file, fileName, reserveFolder.id, JSON.stringify({ projectId, reserveId }));

            toast({
                title: "Photo sauvegardée",
                description: "La photo a été synchronisée sur Google Drive.",
            });

            // Return the webViewLink or a structure that can be used
            // Note: webViewLink might require auth to view depending on sharing settings.
            // For the app, we might store the ID and fetch on demand, or use thumbnailLink.
            return uploadedFile;

        } catch (error) {
            console.error("Photo upload error", error);
            toast({
                title: "Erreur d'upload",
                description: "Impossible de sauvegarder la photo.",
                variant: "destructive",
            });
            return null;
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <GoogleDriveContext.Provider value={{
            isAuthenticated: !!accessToken,
            accessToken,
            user,
            userEmail,
            login,
            logout,
            syncData,
            loadData,
            isSyncing,
            pendingSync,
            lastSynced,
            uploadDocument,
            getDocuments,
            uploadReservePhoto
        }}>
            {children}
        </GoogleDriveContext.Provider>
    );
};

export const useGoogleDrive = () => {
    const context = useContext(GoogleDriveContext);
    if (context === undefined) {
        throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
    }
    return context;
};
