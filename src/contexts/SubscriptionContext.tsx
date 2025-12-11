import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDevice } from '@/contexts/DeviceContext';

const API_URL = "http://localhost:3000";

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
    }, [subscription]);

    // Validate active license with server on load
    useEffect(() => {
        const validateCurrentLicense = async () => {
            if (subscription.status === 'active' && subscription.licenseKey) {
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
                        // Server returned error (e.g. 403 Revoked), deactivate locally
                        console.warn("License validation failed (server rejected), deactivating.");
                        setSubscription(prev => ({
                            ...prev,
                            status: 'inactive',
                            licenseKey: undefined
                        }));
                    }
                } catch (error) {
                    console.error("License validation check failed (network error)", error);
                }
            }
        };

        validateCurrentLicense();
    }, [subscription.status, subscription.licenseKey]);

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
        // Server checks this during activation, so we assume true here or could add a specific endpoint later
        return { canStartTrial: true };
    };

    // Start trial with server registration
    const startTrial = async (email: string): Promise<{ success: boolean; message: string }> => {
        setIsLoading(true);

        try {
            // Register trial with server
            const response = await fetch(`${API_URL}/api/activate-trial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    machineId,
                    email,
                    days: 7 // Default trial duration
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
            // Fallback to local-only trial if server unavailable
            const now = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            setSubscription({
                status: 'trial',
                plan: 'trial',
                startDate: now.toISOString(),
                endDate: endDate.toISOString(),
                activatedAt: now.toISOString(),
                trialUsed: true,
                email: email,
            });

            setIsLoading(false);
            return {
                success: true,
                message: 'Essai activé en mode hors ligne. La synchronisation sera effectuée ultérieurement.'
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
