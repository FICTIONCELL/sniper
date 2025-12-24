import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://sniper-rptn.onrender.com';

export interface UserProfileData {
    // User Profile
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    companyLogo: string;
    showLogoInPV: boolean;

    // Subscription Info
    subscriptionStatus: 'trial' | 'active' | 'expired' | 'inactive';
    subscriptionPlan: 'trial' | 'monthly' | 'yearly' | 'lifetime';
    subscriptionStartDate: string;
    subscriptionExpiryDate: string;
    trialUsed?: boolean;

    // New License Data (for MongoDB separation)
    licenseKey?: string;
    licenseStart?: string;
    licenseEnd?: string;
    daysLeft?: number;
    lastLogin?: string;

    // Metadata
    machineId: string;
    lastUpdated: string;

    // Full App Data (Optional - now primarily for Google Drive)
    projects?: any[];
    blocks?: any[];
    apartments?: any[];
    categories?: any[];
    contractors?: any[];
    reserves?: any[];
    tasks?: any[];
    receptions?: any[];
    settings?: any;
    devices?: any[];
}

export const mongoDbService = {
    async saveProfile(profileData: UserProfileData): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.post(`${API_URL}/api/user-profile/save`, profileData);
            return response.data;
        } catch (error: any) {
            console.error('Error saving profile to MongoDB:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to save profile'
            };
        }
    },

    async getProfile(email: string): Promise<UserProfileData | null> {
        try {
            const response = await axios.get(`${API_URL}/api/user-profile/${email}`);
            return response.data.profile;
        } catch (error: any) {
            console.error('Error getting profile from MongoDB:', error);
            return null;
        }
    }
};
