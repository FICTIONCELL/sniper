/**
 * INSTRUCTIONS: Add this code to Settings.tsx in the Profile tab
 * Location: After the "Company Settings" Card (around line 744)
 * Before: </TabsContent> for the profile tab
 */

{/* === ADD THIS CARD BEFORE </TabsContent> === */ }
<Card>
    <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            {t('saveProfile') || 'Sauvegarder le profil'}
        </CardTitle>
        <CardDescription>
            {t('saveProfileDesc') || 'Sauvegardez votre profil et vos informations d\'abonnement sur Google Drive et dans la base de données.'}
        </CardDescription>
    </CardHeader>
    <CardContent>
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                    <p className="text-sm font-medium">{t('profileBackup') || 'Sauvegarde de profil'}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('profileBackupDesc') || 'Vos données seront sauvegardées dans le dossier sniper_database sur Google Drive'}
                    </p>
                </div>
                <Button
                    onClick={async () => {
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

                            const profileData: UserProfileData = {
                                name: userProfile.name,
                                email: userProfile.email,
                                phone: userProfile.phone,
                                avatar: userProfile.avatar,
                                companyLogo: userProfile.companyLogo,
                                showLogoInPV: userProfile.showLogoInPV,
                                subscriptionStatus: subscription.status,
                                subscriptionPlan: subscription.plan,
                                subscriptionStartDate: subscription.startDate,
                                subscriptionExpiryDate: subscription.endDate,
                                machineId: machineId,
                                lastUpdated: new Date().toISOString()
                            };

                            // Save to Google Drive
                            if (accessToken) {
                                await googleDriveService.saveUserProfile(accessToken, profileData.machineId, profileData);
                            }

                            // Save to Database
                            const result = await mongoDbService.saveProfile(profileData);

                            if (result.success) {
                                toast({
                                    title: "✅ Profil sauvegardé",
                                    description: `Fichier: ${machineId}_abonment.json sauvegardé sur Google Drive et dans la base de données.`,
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
                    }}
                    disabled={isSavingProfile || !isAuthenticated}
                    className="gap-2"
                >
                    {isSavingProfile ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sauvegarde...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Sauvegarder
                        </>
                    )}
                </Button>
            </div>
        </div>
    </CardContent>
</Card>
{/* === END OF CODE TO ADD === */ }
