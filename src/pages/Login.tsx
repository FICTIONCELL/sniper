import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse: any) => {
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);
            console.log("User:", decoded);

            // Send to SniperAbonnement API to register/update
            // We use a machine ID (mocked for now, or stored in localStorage)
            let machineId = localStorage.getItem('sniper_machine_id');
            if (!machineId) {
                machineId = 'machine_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('sniper_machine_id', machineId);
            }

            // Call API
            try {
                await fetch('http://localhost:3000/api/register-machine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: decoded.email,
                        passwordHash: 'google-oauth', // Placeholder
                        machineId: machineId,
                        ip: 'client-ip' // Server will handle if missing
                    })
                });
            } catch (e) {
                console.error("Failed to register with admin server", e);
                // Proceed anyway for now, or block? User said "not function if not connected"
            }

            onLogin(decoded);
            navigate('/');
            toast.success(`Welcome, ${decoded.name}!`);

        } catch (error) {
            console.error("Login Failed", error);
            toast.error("Login Failed");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <div className="p-8 border rounded-lg shadow-lg bg-card">
                <h1 className="text-2xl font-bold mb-6 text-center">Sniper Build Flow</h1>
                <p className="mb-6 text-center text-muted-foreground">Please sign in with Google to continue.</p>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => {
                            console.log('Login Failed');
                            toast.error("Google Login Failed");
                        }}
                        theme="filled_black"
                        shape="pill"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
