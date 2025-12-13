import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://sniper-rptn.onrender.com';

export interface UserProfileData {
    // User Profile
    name: string;
    email: string;
    phone: string;
    avatar: string;
    companyLogo: string;
    showLogoInPV: boolean;

    // Subscription Info
    subscriptionStatus: 'trial' | 'active' | 'expired' | 'inactive';
    subscriptionPlan: 'trial' | 'monthly' | 'yearly' | 'lifetime';
    subscriptionStartDate: string;
    subscriptionExpiryDate: string;

    // Metadata
    machineId: string;
    lastUpdated: string;
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

    async getProfile(machineId: string): Promise<UserProfileData | null> {
        try {
            const response = await axios.get(`${API_URL}/api/user-profile/${machineId}`);
            return response.data.profile;
        } catch (error: any) {
            console.error('Error getting profile from MongoDB:', error);
            return null;
        }
    }
};
