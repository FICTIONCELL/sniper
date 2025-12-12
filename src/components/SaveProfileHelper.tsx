// Save Profile Button Component for Settings.tsx Profile Tab
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveProfileButtonProps {
    onClick: () => void;
    isSaving: boolean;
}

export const SaveProfileButton = ({ onClick, isSaving }: SaveProfileButtonProps) => {
    return (
        <div className="flex justify-end pt-4 border-t">
            <Button
                onClick={onClick}
                disabled={isSaving}
                className="gap-2"
            >
                {isSaving ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sauvegarde en cours...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Sauvegarder mon profil
                    </>
                )}
            </Button>
        </div>
    );
};

// Handler function to add to Settings.tsx
export const handleSaveProfile = async ({
    isAuthenticated,
    accessToken,
    userProfile,
    subscription,
    currentDevice,
    setIsSavingProfile,
    toast,
    googleDriveService,
    mongoDbService
}: any) => {
    if (!isAuthenticated) {
        toast({
            title: "Connexion requise",
            description: "Veuillez vous connecter à Google Drive pour sauvegarder votre profil.",
            variant: "destructive"
        });
        return;
    }

    setIsSavingProfile(true);

    try {
        const machineId = currentDevice?.deviceId || localStorage.getItem('sniper_device_id') || 'unknown';

        const profileData = {
            // User Profile
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            avatar: userProfile.avatar,
            companyLogo: userProfile.companyLogo,
            showLogoInPV: userProfile.showLogoInPV,

            // Subscription Info
            subscriptionStatus: subscription.status,
            subscriptionPlan: subscription.plan,
            subscriptionStartDate: subscription.startDate,
            subscriptionExpiryDate: subscription.endDate,

            // Metadata
            machineId: machineId,
            lastUpdated: new Date().toISOString()
        };

        // Save to Google Drive
        if (accessToken) {
            await googleDriveService.saveUserProfile(
                accessToken,
                profileData.machineId,
                profileData
            );
        }

        // Save to database
        const result = await mongoDbService.saveProfile(profileData);

        if (result.success) {
            toast({
                title: "✅ Profil sauvegardé",
                description: "Votre profil et abonnement ont été sauvegardés avec succès.",
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        console.error('Error saving profile:', error);
        toast({
            title: "❌ Erreur de sauvegarde",
            description: error.message || "Impossible de sauvegarder le profil.",
            variant: "destructive"
        });
    } finally {
        setIsSavingProfile(false);
    }
};
