import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDevice } from '@/contexts/DeviceContext';

const API_URL = import.meta.env.VITE_API_URL || "https://sniper-rptn.onrender.com";

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'inactive';
export type SubscriptionPlan = 'trial' | 'monthly' | 'yearly' | 'lifetime';

export interface SubscriptionData {
    status: SubscriptionStatus;
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
    licenseKey?: string;
    activatedAt?: string;
    trialUsed?: boolean;
    email?: string;
}

export interface UsageLimits {
    maxProjects: number;
    maxBlocks: number;
    maxReserves: number;
    maxReceptions: number;
}

interface TrialCheckResult {
    canStartTrial: boolean;
    trialUsed?: boolean;
    licenseKey?: string;
    previousTrial?: {
        started_at: string;
        expired_at: string;
    };
}

interface SubscriptionContextType {
    subscription: SubscriptionData;
    daysRemaining: number;
    progressPercentage: number;
    isActive: boolean;
    isTrial: boolean;
    limits: UsageLimits;
    trialAvailable: boolean;
    isLoading: boolean;
    canAddProject: (currentCount: number) => boolean;
    canAddBlock: (currentCount: number) => boolean;
    canAddReserve: (currentCount: number) => boolean;
    canAddReception: (currentCount: number) => boolean;
    activateSubscription: (licenseKey: string, email: string) => Promise<{ success: boolean; message: string }>;
    startTrial: (email: string) => Promise<{ success: boolean; message: string }>;
    cancelSubscription: () => void;
    checkTrialAvailability: (email: string) => Promise<TrialCheckResult>;
}

// Trial limits
const TRIAL_LIMITS: UsageLimits = {
    maxProjects: 1,
    maxBlocks: 2,
    maxReserves: 100,
    maxReceptions: 2,
};

// Unlimited for paid plans
const UNLIMITED_LIMITS: UsageLimits = {
    maxProjects: Infinity,
    maxBlocks: Infinity,
    maxReserves: Infinity,
    maxReceptions: Infinity,
};

const defaultSubscription: SubscriptionData = {
    status: 'inactive',
    plan: 'trial',
    startDate: '',
    endDate: '',
    trialUsed: false,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [subscription, setSubscription] = useLocalStorage<SubscriptionData>('sniper_subscription', defaultSubscription);
    const [daysRemaining, setDaysRemaining] = useState(0);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [trialAvailable, setTrialAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Get device info for machine ID
    const { currentDevice } = useDevice();
    const machineId = currentDevice?.deviceId || localStorage.getItem('sniper_device_id') || 'unknown';

    // Calculate days remaining and progress
    useEffect(() => {
        if (!subscription.endDate || subscription.status === 'inactive') {
            setDaysRemaining(0);
            setProgressPercentage(0);
            return;
        }

        const now = new Date();
        const endDate = new Date(subscription.endDate);
        const startDate = new Date(subscription.startDate);

        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        setDaysRemaining(Math.max(0, remaining));
        setProgressPercentage(totalDays > 0 ? Math.max(0, Math.min(100, (remaining / totalDays) * 100)) : 0);

        // Auto-expire subscription
        if (remaining <= 0 && subscription.status !== 'expired') {
            setSubscription(prev => ({ ...prev, status: 'expired' }));
        }

        // Sync trial availability
        if (subscription.trialUsed) {
            setTrialAvailable(false);
        } else {
            setTrialAvailable(true);
        }
    }, [subscription]);

    // Validate active license with server on load and periodically
    useEffect(() => {
        const validateCurrentLicense = async () => {
            if ((subscription.status === 'active' || subscription.status === 'trial') && subscription.licenseKey && subscription.email) {
                try {
                    const response = await fetch(`${API_URL}/api/validate-license`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: subscription.licenseKey,
                            machineId,
                            email: subscription.email
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.warn("License validation failed (server rejected):", errorData.error);

                        // If revoked or suspended, deactivate locally immediately
                        if (response.status === 403 || response.status === 401) {
                            setSubscription(prev => ({
                                ...prev,
                                status: 'inactive',
                                licenseKey: undefined
                            }));
                        }
                    } else {
                        const data = await response.json();
                        if (!data.valid) {
                            setSubscription(prev => ({
                                ...prev,
                                status: 'inactive',
                                licenseKey: undefined
                            }));
                        }
                    }
                } catch (error) {
                    console.error("License validation check failed (network error)", error);
                }
            }
        };

        validateCurrentLicense();

        // Live revocation check: validate every 5 minutes
        const interval = setInterval(validateCurrentLicense, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [subscription.status, subscription.licenseKey, subscription.email]);

    const isActive = subscription.status === 'active' || (subscription.status === 'trial' && daysRemaining > 0);
    const isTrial = subscription.status === 'trial';

    // Get current limits based on subscription status
    const limits: UsageLimits = isTrial ? TRIAL_LIMITS : UNLIMITED_LIMITS;

    // Helper functions to check if user can add more items
    const canAddProject = (currentCount: number): boolean => {
        if (!isActive) return false;
        if (!isTrial) return true;
        return currentCount < limits.maxProjects;
    };

    const canAddBlock = (currentCount: number): boolean => {
        if (!isActive) return false;
        if (!isTrial) return true;
        return currentCount < limits.maxBlocks;
    };

    const canAddReserve = (currentCount: number): boolean => {
        if (!isActive) return false;
        if (!isTrial) return true;
        return currentCount < limits.maxReserves;
    };

    const canAddReception = (currentCount: number): boolean => {
        if (!isActive) return false;
        if (!isTrial) return true;
        return currentCount < limits.maxReceptions;
    };

    // Check if trial is available for this machine/email
    const checkTrialAvailability = async (email: string): Promise<TrialCheckResult> => {
        try {
            const response = await fetch(`${API_URL}/api/trial/check/${encodeURIComponent(email)}`);
            if (response.ok) {
                return await response.json();
            }
            return { canStartTrial: false };
        } catch (error) {
            console.error('Failed to check trial availability:', error);
            return { canStartTrial: true }; // Fallback to true if server error
        }
    };

    // Start trial with server registration
    const startTrial = async (email: string): Promise<{ success: boolean; message: string }> => {
        setIsLoading(true);

        try {
            // First check if a trial already exists
            const availability = await checkTrialAvailability(email);

            if (availability.trialUsed && availability.licenseKey) {
                // Resume existing trial
                const result = await activateSubscription(availability.licenseKey, email);
                setIsLoading(false);
                if (result.success) {
                    return { success: true, message: 'Votre essai gratuit a été repris.' };
                } else {
                    return { success: false, message: 'Votre essai gratuit a expiré ou a été révoqué.' };
                }
            }

            if (!availability.canStartTrial) {
                setIsLoading(false);
                return { success: false, message: 'Essai déjà utilisé pour cet email.' };
            }

            // Register new trial with server
            const response = await fetch(`${API_URL}/api/trial/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    machineId,
                    email,
                    deviceName: currentDevice?.model || 'Unknown Device'
                })
            });

            if (response.ok) {
                const data = await response.json();

                setSubscription({
                    status: 'trial',
                    plan: 'trial',
                    startDate: new Date().toISOString(),
                    endDate: data.expires,
                    activatedAt: new Date().toISOString(),
                    trialUsed: true,
                    email: email,
                    licenseKey: data.licenseKey // Store the key for validation
                });

                setTrialAvailable(false);
                setIsLoading(false);
                return { success: true, message: 'Essai gratuit activé avec succès!' };
            } else {
                const error = await response.json();
                setIsLoading(false);
                return { success: false, message: error.error || 'Échec de l\'activation de l\'essai.' };
            }
        } catch (error) {
            console.error('Failed to start trial:', error);
            setIsLoading(false);
            return {
                success: false,
                message: 'Impossible de contacter le serveur de licences.'
            };
        }
    };

    // Activate subscription with license key
    const activateSubscription = async (licenseKey: string, email: string): Promise<{ success: boolean; message: string }> => {
        if (!licenseKey || licenseKey.length < 10) {
            return { success: false, message: 'Clé de licence invalide.' };
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/validate-license`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: licenseKey, machineId, email })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setSubscription({
                    status: 'active',
                    plan: data.type || 'monthly', // Use returned type or default
                    startDate: new Date().toISOString(),
                    endDate: data.expires,
                    licenseKey: licenseKey,
                    activatedAt: new Date().toISOString(),
                    email: email,
                });

                setIsLoading(false);
                return { success: true, message: 'Licence activée avec succès!' };
            } else {
                setIsLoading(false);
                return { success: false, message: data.error || 'Licence invalide.' };
            }
        } catch (error) {
            console.error('Failed to validate license:', error);
            setIsLoading(false);
            return { success: false, message: 'Impossible de contacter le serveur de licences.' };
        }
    };

    const cancelSubscription = () => {
        setSubscription({
            ...subscription,
            status: 'inactive',
        });
    };

    return (
        <SubscriptionContext.Provider value={{
            subscription,
            daysRemaining,
            progressPercentage,
            isActive,
            isTrial,
            limits,
            trialAvailable,
            isLoading,
            canAddProject,
            canAddBlock,
            canAddReserve,
            canAddReception,
            activateSubscription,
            startTrial,
            cancelSubscription,
            checkTrialAvailability,
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
