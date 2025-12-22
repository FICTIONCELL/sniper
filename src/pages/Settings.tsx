import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Moon, Sun, Bell, BellOff, Globe, Download, Upload, Smartphone, Trash2, Cloud, Loader2, User, Building, Laptop, Monitor, Save, CheckCircle, XCircle, Clock, Key, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage, useProjects, useBlocks, useApartments, useCategories, useContractors, useReserves, useTasks, useReceptions } from "@/hooks/useLocalStorage";
import { useTranslation } from "@/contexts/TranslationContext";
import { generateDemoData } from "@/utils/demoData";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTheme } from "@/contexts/ThemeProvider";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDevice } from "@/contexts/DeviceContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNotification } from "@/contexts/NotificationContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { googleDriveService } from "@/services/googleDriveService";
import { mongoDbService, UserProfileData } from "@/services/mongoDbService";
import { saveProfileByEmail } from '@/services/profileAutoLoadService';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { compressImage, compressBase64 } from "@/utils/imageCompression";

interface SettingsData {
  notifications: boolean;
  language: 'fr' | 'ar' | 'en' | 'es';
  compactMode: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  companyLogo: string;
  showLogoInPV: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation();
  const [settings, setSettings] = useLocalStorage<SettingsData>('settings', {
    notifications: true,
    language: 'fr',
    compactMode: false
  });

  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('sniper_user_profile', {
    name: '',
    email: '',
    phone: '',
    avatar: '',
    companyLogo: '',
    showLogoInPV: false
  });

  // Data hooks for export/import
  const [projects, setProjects] = useProjects();
  const [blocks, setBlocks] = useBlocks();
  const [apartments, setApartments] = useApartments();
  const [categories, setCategories] = useCategories();
  const [contractors, setContractors] = useContractors();
  const [reserves, setReserves] = useReserves();
  const [tasks, setTasks] = useTasks();
  const [receptions, setReceptions] = useReceptions();

  const { theme: currentTheme, setTheme: setCurrentTheme } = useTheme();
  const [eraseCode, setEraseCode] = useState("");

  const { isAuthenticated, accessToken, login, logout, isSyncing, syncData, lastSynced, pendingSync, user, userEmail } = useGoogleDrive();
  const { currentDevice, devices, removeDevice } = useDevice();
  const { subscription, daysRemaining, progressPercentage, isActive, isTrial, limits, trialAvailable, isLoading, activateSubscription, startTrial, cancelSubscription } = useSubscription();
  const [licenseKey, setLicenseKey] = useState("");
  const [trialEmail, setTrialEmail] = useState("");
  const [activationEmail, setActivationEmail] = useState("");
  const { state: notificationState, updateSettings: updateNotificationSettings } = useNotification();
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadDemoData = () => {
    const demoData = generateDemoData();

    setProjects(demoData.projects);
    setBlocks(demoData.blocks);
    setApartments(demoData.apartments);
    setCategories(demoData.categories);
    setContractors(demoData.contractors);
    setReserves(demoData.reserves);
    setTasks(demoData.tasks);
    setReceptions(demoData.receptions);

    toast({
      title: t('demoDataLoaded'),
      description: t('demoDataLoadedDesc'),
    });
  };

  const handleEraseData = () => {
    if (eraseCode !== "1270") {
      toast({
        title: t('incorrectCode'),
        description: t('incorrectCodeDesc'),
        variant: "destructive"
      });
      return;
    }

    // Effacer toutes les données
    setProjects([]);
    setBlocks([]);
    setApartments([]);
    setCategories([]);
    setContractors([]);
    setReserves([]);
    setTasks([]);
    setReceptions([]);

    setEraseCode("");

    toast({
      title: t('dataErased'),
      description: t('dataErasedDesc'),
    });
  };

  // Enforce logged-in email for trial
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      setTrialEmail(userEmail);
    }
  }, [isAuthenticated, userEmail]);

  useEffect(() => {
    // Apply RTL for Arabic
    const root = document.documentElement;
    if (language === 'ar') {
      root.setAttribute('dir', 'rtl');
    } else {
      root.setAttribute('dir', 'ltr');
    }
  }, [language]);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(theme);
    toast({
      title: t('themeUpdated'),
      description: `${t('themeChangedTo')}: ${getThemeName(theme)}`,
    });
  };

  const handleNotificationsChange = (notifications: boolean) => {
    setSettings(prev => ({ ...prev, notifications }));
    toast({
      title: t('notificationsUpdated'),
      description: notifications ? t('notificationsEnabled') : t('notificationsDisabled'),
    });
  };

  const handleLanguageChange = (newLanguage: 'fr' | 'ar' | 'en' | 'es') => {
    setSettings(prev => ({ ...prev, language: newLanguage }));
    setLanguage(newLanguage);
    toast({
      title: t('languageUpdated'),
      description: `${t('languageChangedTo')}: ${getLanguageName(newLanguage)}`,
    });
  };

  const getLanguageName = (lang: string) => {
    const names: Record<string, string> = {
      fr: 'Français',
      ar: 'العربية',
      en: 'English',
      es: 'Español'
    };
    return names[lang] || lang;
  };

  const getThemeName = (theme: string) => {
    switch (theme) {
      case 'light': return t('lightTheme');
      case 'dark': return t('darkTheme');
      case 'system': return t('systemTheme');
      default: return theme;
    }
  };

  const handleCompactModeChange = (compactMode: boolean) => {
    setSettings(prev => ({ ...prev, compactMode }));
    toast({
      title: t('compactModeUpdated'),
      description: compactMode ? t('compactModeEnabled') : t('compactModeDisabled'),
    });
  };

  const exportData = () => {
    const allData = {
      projects,
      blocks,
      apartments,
      categories,
      contractors,
      reserves,
      tasks,
      receptions,
      settings,
      userProfile,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: t('dataExported'),
      description: t('dataExportedDescription'),
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        if (importedData.projects) setProjects(importedData.projects);
        if (importedData.blocks) setBlocks(importedData.blocks);
        if (importedData.apartments) setApartments(importedData.apartments);
        if (importedData.categories) setCategories(importedData.categories);
        if (importedData.contractors) setContractors(importedData.contractors);
        if (importedData.reserves) setReserves(importedData.reserves);
        if (importedData.tasks) setTasks(importedData.tasks);
        if (importedData.receptions) setReceptions(importedData.receptions);
        if (importedData.settings) setSettings(importedData.settings);
        if (importedData.userProfile) setUserProfile(importedData.userProfile);

        toast({
          title: t('dataImported'),
          description: t('dataImportedDescription'),
        });
      } catch (error) {
        toast({
          title: t('importError'),
          description: t('invalidFileFormat'),
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetSettings = () => {
    const defaultSettings: SettingsData = {
      notifications: true,
      language: 'fr',
      compactMode: false
    };
    setSettings(defaultSettings);
    setCurrentTheme('light');
    setLanguage('fr');
    toast({
      title: t('settingsReset'),
      description: t('settingsResetDescription'),
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'companyLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image: max width 500px for avatar, 800px for logo, 70% quality
        const maxWidth = field === 'avatar' ? 500 : 800;
        const compressedImage = await compressImage(file, maxWidth, 0.7);
        setUserProfile(prev => ({ ...prev, [field]: compressedImage }));
        toast({
          title: t('imageUploaded'),
          description: t('imageUploadedDesc'),
        });
      } catch (error) {
        console.error("Image compression error:", error);
        toast({
          title: t('error'),
          description: "Failed to process image.",
          variant: "destructive"
        });
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    const lowerType = (type || '').toLowerCase();
    if (lowerType.includes('mobile') || lowerType.includes('android') || lowerType.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  return (
    <div className="p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          {t('settings')}
        </h1>
        <p className="text-muted-foreground">{t('customizeExperience')}</p>
      </div>

      <Tabs defaultValue="general" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t('settings')}</TabsTrigger>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
          <TabsTrigger value="devices">{t('devices') || 'Appareils'}</TabsTrigger>
          <TabsTrigger value="subscription">{t('subscription') || 'Abonnement'}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  {t('appearance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-select" className="text-base">{t('interfaceTheme')}</Label>
                  <Select value={currentTheme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          {t('lightTheme')}
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          {t('darkTheme')}
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <SettingsIcon className="h-4 w-4" />
                          {t('systemTheme')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('chooseAppearance')}
                </p>
              </CardContent>
            </Card>

            {/* Notifications Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {notificationState.notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  {t('notifications')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Master Switch */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifications-master" className="text-base font-medium">{t('enableNotifications') || 'Activer les notifications'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationsDescription') || 'Activez ou désactivez toutes les notifications de l\'application.'}
                    </p>
                  </div>
                  <Switch
                    id="notifications-master"
                    checked={notificationState.notificationsEnabled}
                    onCheckedChange={(checked) => updateNotificationSettings({ notificationsEnabled: checked })}
                  />
                </div>

                {/* Sound Switch */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-1">
                    <Label htmlFor="notifications-sound" className="text-base">{t('notificationSound') || 'Sons de notification'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationSoundDesc') || 'Jouer un son lors de la réception d\'une notification.'}
                    </p>
                  </div>
                  <Switch
                    id="notifications-sound"
                    checked={notificationState.soundEnabled}
                    onCheckedChange={(checked) => updateNotificationSettings({ soundEnabled: checked })}
                    disabled={!notificationState.notificationsEnabled}
                  />
                </div>

                {/* Toast Switch */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-1">
                    <Label htmlFor="notifications-toast" className="text-base">{t('notificationMessage') || 'Messages de notification'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('notificationMessageDesc') || 'Afficher les messages pop-up (toasts) à l\'écran.'}
                    </p>
                  </div>
                  <Switch
                    id="notifications-toast"
                    checked={notificationState.toastsEnabled}
                    onCheckedChange={(checked) => updateNotificationSettings({ toastsEnabled: checked })}
                    disabled={!notificationState.notificationsEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('languageAndRegion')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="language-select" className="text-base">{t('interfaceLanguage')}</Label>
                  <Select value={settings.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">
                        <div className="flex items-center gap-2">
                          🇫🇷 Français
                        </div>
                      </SelectItem>
                      <SelectItem value="ar">
                        <div className="flex items-center gap-2">
                          🇸🇦 العربية
                        </div>
                      </SelectItem>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          🇺🇸 English
                        </div>
                      </SelectItem>
                      <SelectItem value="es">
                        <div className="flex items-center gap-2">
                          🇪🇸 Español
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('uiLanguageDescription')}
                </p>
              </CardContent>
            </Card>

            {/* Compact Mode Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  {t('compactMode')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="compact-switch" className="text-base">{t('enableCompactMode')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('compactModeDescription')}
                    </p>
                  </div>
                  <Switch
                    id="compact-switch"
                    checked={settings.compactMode}
                    onCheckedChange={handleCompactModeChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Google Drive Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  {t('googleDrive')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-1">
                    <Label className="text-base">{t('connectionStatus')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {isAuthenticated ? t('connected') : t('disconnected')}
                    </p>

                    {isAuthenticated && user && (
                      <div className="flex items-center gap-3 mt-2 p-2 bg-muted/50 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.picture} alt={user.name} />
                          <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    )}

                    {lastSynced && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('lastSynced')}: {lastSynced.toLocaleString()}
                      </p>
                    )}
                    {pendingSync && (
                      <p className="text-xs text-yellow-600 mt-1">
                        {t('syncPending')}...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    {isAuthenticated ? (
                      <>
                        <Button variant="outline" onClick={syncData} disabled={isSyncing} size="sm">
                          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          {t('syncNow')}
                        </Button>
                        <Button variant="destructive" onClick={logout} size="sm">
                          {t('disconnect')}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => login()}>
                        {t('connect')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {t('dataManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">{t('loadDemoData')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('loadDemoDataDescription')}
                    </p>
                  </div>
                  <Button variant="outline" onClick={loadDemoData}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('loadDemo')}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">{t('exportData')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('exportDataDescription')}
                    </p>
                  </div>
                  <Button variant="outline" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('export')}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">{t('importData')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('importDataDescription')}
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                      id="import-file"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('import')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">{t('eraseAllDataTitle')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('eraseAllDataDescription')}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('eraseData')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('eraseAllDataTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('eraseAllDataConfirmDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="my-4">
                        <Input
                          type="text"
                          placeholder={t('enterCode')}
                          value={eraseCode}
                          onChange={(e) => setEraseCode(e.target.value)}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEraseCode("")}>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEraseData}>
                          {t('erasePermanently')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">{t('resetToDefault')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('resetAllSettings')}
                    </p>
                  </div>
                  <Button variant="outline" onClick={resetSettings}>
                    {t('reset')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('personalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('avatar')}</Label>
                <div className="flex items-center gap-4">
                  {userProfile.avatar && (
                    <img src={userProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t('companySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('companyLogo')}</Label>
                <div className="flex items-center gap-4">
                  {userProfile.companyLogo && (
                    <div className="relative">
                      <img src={userProfile.companyLogo} alt="Company Logo" className="w-32 h-auto object-contain border rounded-md p-1" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                        onClick={() => setUserProfile({ ...userProfile, companyLogo: '' })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'companyLogo')}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-logo-pv" className="text-base">{t('showLogoInPV')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('showLogoInPVDesc')}
                  </p>
                </div>
                <Switch
                  id="show-logo-pv"
                  checked={userProfile.showLogoInPV}
                  onCheckedChange={(checked) => setUserProfile({ ...userProfile, showLogoInPV: checked })}
                />
              </div>
            </CardContent>
          </Card>

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
                        const userEmailForProfile = userProfile.email || userEmail || 'unknown';
                        const machineId = currentDevice?.deviceId || localStorage.getItem('sniper_device_id') || 'unknown';

                        // Compress images before saving if they exist
                        let compressedAvatar = userProfile.avatar;
                        if (compressedAvatar && compressedAvatar.length > 100000) { // If > 100KB
                          try {
                            compressedAvatar = await compressBase64(compressedAvatar, 400, 0.6);
                          } catch (e) {
                            console.warn("Failed to compress avatar", e);
                          }
                        }

                        let compressedLogo = userProfile.companyLogo;
                        if (compressedLogo && compressedLogo.length > 100000) { // If > 100KB
                          try {
                            compressedLogo = await compressBase64(compressedLogo, 600, 0.6);
                          } catch (e) {
                            console.warn("Failed to compress logo", e);
                          }
                        }

                        // 1. Prepare MongoDB Payload (Account/License Data ONLY)
                        const mongoPayload = {
                          email: userEmailForProfile,
                          subscriptionStatus: subscription.status || 'inactive',
                          licenseKey: subscription.licenseKey || null,
                          licenseEnd: subscription.endDate || null,
                          licenseStart: subscription.startDate || null,
                          daysLeft: daysRemaining,
                          lastLogin: new Date().toISOString()
                        };

                        // 2. Prepare Google Drive Payload (Full Backup)
                        const drivePayload: UserProfileData = {
                          name: userProfile.name,
                          email: userEmailForProfile,
                          phone: userProfile.phone,
                          avatar: compressedAvatar,
                          companyLogo: compressedLogo,
                          showLogoInPV: userProfile.showLogoInPV,
                          subscriptionStatus: subscription.status,
                          subscriptionPlan: subscription.plan,
                          subscriptionStartDate: subscription.startDate,
                          subscriptionExpiryDate: subscription.endDate,
                          licenseKey: subscription.licenseKey,
                          licenseStart: subscription.startDate,
                          licenseEnd: subscription.endDate,
                          daysLeft: daysRemaining,
                          lastLogin: new Date().toISOString(),
                          machineId: machineId,
                          lastUpdated: new Date().toISOString(),
                          projects,
                          blocks,
                          apartments,
                          categories,
                          contractors,
                          reserves,
                          tasks,
                          receptions,
                          settings,
                          devices
                        };

                        if (compressedAvatar !== userProfile.avatar || compressedLogo !== userProfile.companyLogo) {
                          setUserProfile(prev => ({
                            ...prev,
                            avatar: compressedAvatar,
                            companyLogo: compressedLogo
                          }));
                        }

                        if (accessToken && userEmailForProfile !== 'unknown') {
                          await saveProfileByEmail(accessToken, userEmailForProfile, drivePayload);
                        }

                        const result = await mongoDbService.saveProfile(mongoPayload as any);

                        if (result.success) {
                          toast({
                            title: "✅ Profil sauvegardé",
                            description: `Fichier: ${machineId}_abonment.json sauvegardé sur Google Drive et dans la base de données.`,
                          });
                        } else {
                          toast({
                            title: "⚠️ Sauvegarde partielle",
                            description: `Sauvegardé sur Drive mais erreur DB: ${result.message}`,
                            variant: "destructive"
                          });
                        }

                      } catch (error) {
                        console.error("Error saving profile", error);
                        toast({
                          title: "❌ Erreur",
                          description: "Impossible de sauvegarder le profil.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsSavingProfile(false);
                      }
                    }}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {t('save')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                {t('connectedDevices') || 'Appareils connectés'}
              </CardTitle>
              <CardDescription>
                {t('manageDevicesDesc') || 'Gérez les appareils connectés à votre compte.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devices.map((device) => (
                  <div key={device.deviceId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        {getDeviceIcon(device.os || 'unknown')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{device.model || 'Unknown Device'}</p>
                          {device.deviceId === currentDevice?.deviceId && (
                            <Badge variant="secondary" className="text-xs">
                              {t('currentDevice') || 'Cet appareil'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('lastActive')}: {new Date(device.lastActive).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {device.deviceId !== currentDevice?.deviceId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeDevice(device.deviceId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {devices.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    {t('noDevicesFound') || 'Aucun appareil trouvé.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {t('subscriptionStatus') || 'État de l\'abonnement'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div>
                  <p className="font-medium text-lg capitalize">{subscription.plan === 'trial' ? (t('trialVersion') || 'Version d\'essai') : subscription.plan}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={isActive ? "default" : "destructive"}>
                      {isActive ? (t('active') || 'Actif') : (t('inactive') || 'Inactif')}
                    </Badge>
                    {isTrial && isActive && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        {daysRemaining} {t('daysRemaining') || 'jours restants'}
                      </Badge>
                    )}
                    {(subscription.plan as string) === 'lifetime' && isActive && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        👑 {t('lifetimeAccess') || 'Accès à vie'}
                      </Badge>
                    )}
                  </div>
                </div>
                {isActive ? <CheckCircle className="h-8 w-8 text-green-500" /> : <XCircle className="h-8 w-8 text-red-500" />}
              </div>

              {isTrial && isActive && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('trialProgress') || 'Progression de l\'essai'}</span>
                    <span>{daysRemaining} / 30 {t('days') || 'jours'}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" /> {t('projects') || 'Projets'}
                  </h4>
                  <p className="text-2xl font-bold">{projects.length} / {limits.maxProjects === Infinity ? '∞' : limits.maxProjects}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Cloud className="h-4 w-4" /> {t('storage') || 'Stockage'}
                  </h4>
                  <p className="text-2xl font-bold">Local + Drive</p>
                </div>
              </div>

              {!isActive && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">{t('activateSubscription') || 'Activer un abonnement'}</h3>

                  {trialAvailable && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('startFreeTrial') || 'Commencer l\'essai gratuit'}</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                        {t('trialDescription') || 'Profitez de toutes les fonctionnalités pendant 30 jours sans engagement.'}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Email"
                          value={trialEmail}
                          onChange={(e) => setTrialEmail(e.target.value)}
                          className="bg-white dark:bg-background"
                          disabled={isAuthenticated && !!userEmail}
                        />
                        <Button onClick={() => startTrial(trialEmail)} disabled={isLoading || !trialEmail}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('startTrial') || 'Commencer'}
                        </Button>
                      </div>
                      {isAuthenticated && userEmail && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('trialEmailLinked') || 'L\'essai sera lié à votre compte Google connecté.'}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t('licenseKey') || 'Clé de licence'}</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="XXXX-XXXX-XXXX-XXXX"
                          className="pl-9"
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Email associé"
                        className="w-1/3"
                        value={activationEmail}
                        onChange={(e) => setActivationEmail(e.target.value)}
                      />
                      <Button onClick={() => activateSubscription(licenseKey, activationEmail)} disabled={isLoading || !licenseKey || !activationEmail}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('activate') || 'Activer'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isActive && (
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={cancelSubscription}>
                    {t('cancelSubscription') || 'Annuler l\'abonnement'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;