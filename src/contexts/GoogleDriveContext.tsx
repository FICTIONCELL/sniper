import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout, TokenResponse, GoogleOAuthProvider } from '@react-oauth/google';
import { googleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
import { GOOGLE_CLIENT_ID } from '@/config';

interface GoogleDriveContextType {
    isAuthenticated: boolean;
    user: any | null;
    login: () => void;
    logout: () => void;
    syncData: () => Promise<void>;
    loadData: () => Promise<void>;
    isSyncing: boolean;
    pendingSync: boolean;
    lastSynced: Date | null;
    uploadDocument: (file: File | Blob, fileName: string, projectId: string) => Promise<void>;
    getDocuments: (projectId?: string) => Promise<any[]>;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

// Helper component to capture the login hook
const GoogleLoginCapturer = ({ onLoginReady, onLoginSuccess, onLoginError }: any) => {
    const login = useGoogleLogin({
        onSuccess: onLoginSuccess,
        onError: onLoginError,
        scope: 'https://www.googleapis.com/auth/drive.file',
    });

    useEffect(() => {
        onLoginReady(() => login);
    }, [login, onLoginReady]);

    return null;
};

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingSync, setPendingSync] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [loginFn, setLoginFn] = useState<(() => void) | null>(null);

    const { toast } = useToast();
    const { t } = useTranslation();

    const handleLoginSuccess = (tokenResponse: TokenResponse) => {
        setAccessToken(tokenResponse.access_token);
        setUser(true);
        toast({
            title: t('connected'),
            description: t('connectionStatus'),
        });
        checkForRemoteData(tokenResponse.access_token);
    };

    const handleLoginError = () => {
        toast({
            title: t('error'),
            description: "Impossible de se connecter à Google.",
            variant: "destructive",
        });
    };

    const login = () => {
        if (loginFn) {
            loginFn();
        } else {
            toast({
                title: "Configuration requise",
                description: "L'ID Client Google n'est pas configuré dans src/config.ts",
                variant: "destructive",
            });
        }
    };

    const logout = () => {
        googleLogout();
        setAccessToken(null);
        setUser(null);
        toast({
            title: t('disconnected'),
            description: "Vous avez été déconnecté de Google Drive.",
        });
    };

    const checkForRemoteData = async (token: string) => {
        try {
            const file = await googleDriveService.findFile(token);
            if (file) {
                toast({
                    title: "Sauvegarde trouvée",
                    description: "Une sauvegarde existe sur votre Drive. Voulez-vous la charger ?",
                    action: (
                        <button
                            className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium"
                            onClick={() => loadDataWithToken(token)}
                        >
                            Charger
                        </button>
                    ),
                });
            }
        } catch (error) {
            console.error("Error checking for remote data", error);
        }
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
            const file = await googleDriveService.findFile(token);
            if (!file) {
                toast({
                    title: "Aucune sauvegarde trouvée",
                    description: "Aucun fichier de données trouvé sur ce Drive.",
                    variant: "destructive",
                });
                return;
            }

            const data = await googleDriveService.readFile(token, file.id);

            // Restore to localStorage
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'object') {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                } else {
                    localStorage.setItem(key, data[key]);
                }
            });

            // Force reload to apply changes
            window.location.reload();

        } catch (error) {
            console.error("Load error", error);
            toast({
                title: "Erreur de chargement",
                description: "Impossible de charger les données.",
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
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

            // Clear existing timeout
            if (timeoutId) clearTimeout(timeoutId);

            // Set new timeout for 5 seconds
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

    return (
        <GoogleDriveContext.Provider value={{
            isAuthenticated: !!accessToken,
            user,
            login,
            logout,
            syncData,
            loadData,
            isSyncing,
            pendingSync,
            lastSynced,
            uploadDocument,
            getDocuments
        }}>
            {GOOGLE_CLIENT_ID && (
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <GoogleLoginCapturer
                        onLoginReady={setLoginFn}
                        onLoginSuccess={handleLoginSuccess}
                        onLoginError={handleLoginError}
                    />
                </GoogleOAuthProvider>
            )}
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
