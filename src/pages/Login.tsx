import React, { useEffect } from 'react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { mongoDbService } from '@/services/mongoDbService';

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Google Auth
        GoogleAuth.initialize({
            clientId: '884107338123-00mgjgsask7h7asis26gaq3oc3tvorgd.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
        });
    }, []);

    const signIn = async () => {
        try {
            const user = await GoogleAuth.signIn();
            console.log("User:", user);

            // Send to SniperAbonnement API to register/update
            let machineId = localStorage.getItem('sniper_machine_id');
            if (!machineId) {
                machineId = 'machine_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('sniper_machine_id', machineId);
            }

            // Call API
            try {
                await fetch('https://thesniper.onrender.com/api/register-machine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        passwordHash: 'google-oauth', // Placeholder
                        machineId: machineId,
                        ip: 'client-ip' // Server will handle if missing
                    })
                });
            } catch (e) {
                console.error("Failed to register with admin server", e);
            }

            onLogin(user);

            // Fetch and apply profile from DB
            try {
                const profile = await mongoDbService.getProfile(user.email);
                if (profile) {
                    const userProfile = {
                        name: profile.name || user.givenName || user.name || '',
                        email: profile.email || user.email || '',
                        phone: profile.phone || '',
                        avatar: profile.avatar || user.imageUrl || '',
                        companyLogo: profile.companyLogo || '',
                        showLogoInPV: profile.showLogoInPV || false
                    };
                    localStorage.setItem('user_profile', JSON.stringify(userProfile));
                    // Also trigger a storage event to update other components if needed
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (err) {
                console.error("Failed to load profile from DB", err);
            }

            navigate('/');
            toast.success(`Welcome, ${user.givenName || user.name || 'User'}!`);

        } catch (error) {
            console.error("Login Failed", error);
            toast.error("Login Failed");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <div className="p-8 border rounded-lg shadow-lg bg-card w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Sniper Build Flow</h1>
                <p className="mb-6 text-center text-muted-foreground">Please sign in with Google to continue.</p>

                <div className="flex justify-center w-full">
                    <Button
                        onClick={signIn}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 border border-gray-300"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </Button>
                </div>

                <div className="mt-8 text-center text-xs text-muted-foreground">
                    <a href="/privacy-policy" className="hover:underline hover:text-primary transition-colors">
                        Politique de Confidentialité
                    </a>
                    <span className="mx-2">•</span>
                    <a href="/terms-of-service" className="hover:underline hover:text-primary transition-colors">
                        Conditions d'utilisation
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
