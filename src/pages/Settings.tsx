import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Moon, Sun, Bell, BellOff, Globe, Download, Upload, Smartphone, Trash2, Cloud, Loader2, User, Building, Laptop, Monitor } from "lucide-react";
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
import { Crown, Clock, Key, CheckCircle, XCircle, AlertTriangle, Save } from "lucide-react";
import { googleDriveService } from "@/services/googleDriveService";
import { mongoDbService, UserProfileData } from "@/services/mongoDbService";

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

  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('user_profile', {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'companyLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getDeviceIcon = (type: string) => {
    const lowerType = type.toLowerCase();
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
                    {lastSynced && (
                      <p className="text-xs text-muted-foreground">
                        {t('lastSynced')}: {lastSynced.toLocaleString()}
                      </p>
                    )}
                    {userEmail && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {userEmail}
                      </p>
                    )}
                    {pendingSync && (
                      <p className="text-xs text-yellow-600 mt-1">
                        {t('syncPending')}...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isAuthenticated ? (
                      <>
                        <Button variant="outline" onClick={syncData} disabled={isSyncing}>
                          {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          {t('syncNow')}
                        </Button>
                        <Button variant="destructive" onClick={logout}>
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
                    <img src={userProfile.companyLogo} alt="Company Logo" className="w-32 h-auto object-contain" />
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
        </TabsContent>

        <TabsContent value="devices" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {t('connectedDevices') || 'Appareils connectés'}
              </CardTitle>
              <CardDescription>
                {t('connectedDevicesDesc') || 'Gérez les appareils connectés à votre compte.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {devices.map((device) => (
                  <div key={device.deviceId} className="flex items-start justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex gap-4">
                      <div className="mt-1 p-2 bg-muted rounded-full">
                        {getDeviceIcon(device.os || device.brand)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {device.brand} {device.model}
                          </h4>
                          {device.isCurrent && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              {t('currentDevice') || 'Cet appareil'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <p className="flex items-center gap-1">
                            <Globe className="h-3 w-3" /> {device.browser} {device.browserVersion} • {device.os} {device.osVersion}
                          </p>
                          <p className="text-xs">
                            App v{device.appVersion} • {t('lastActive') || 'Dernière activité'}: {new Date(device.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!device.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm(t('confirmRemoveDevice') || 'Voulez-vous vraiment supprimer cet appareil ?')) {
                            removeDevice(device.deviceId);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {devices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('noDevicesFound') || 'Aucun appareil trouvé.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6 mt-6">
          {/* Subscription Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {t('subscriptionStatus') || 'État de l\'abonnement'}
              </CardTitle>
              <CardDescription>
                {t('subscriptionDesc') || 'Gérez votre abonnement et consultez les détails.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subscription.status === 'active' && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t('active') || 'Actif'}
                    </Badge>
                  )}
                  {subscription.status === 'trial' && (
                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
                      <Clock className="h-3 w-3" />
                      {t('trial') || 'Essai Gratuit'}
                    </Badge>
                  )}
                  {(subscription.status === 'expired' || subscription.status === 'inactive') && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {t('expired') || 'Expiré'}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium">
                  {daysRemaining} {t('daysRemaining') || 'jours restants'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('usage') || 'Utilisation'}</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Plan Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">{t('plan') || 'Plan'}</p>
                  <p className="font-medium capitalize">{subscription.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('expiryDate') || 'Date d\'expiration'}</p>
                  <p className="font-medium">{new Date(subscription.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                {!isActive && (
                  <Button className="w-full" onClick={() => document.getElementById('activation-trigger')?.click()}>
                    <Key className="mr-2 h-4 w-4" />
                    {t('activateLicense') || 'Activer une licence'}
                  </Button>
                )}
                {isActive && (
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={cancelSubscription}>
                    {t('cancelSubscription') || 'Annuler l\'abonnement'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activation Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button id="activation-trigger" className="hidden">Activate</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('activateLicense') || 'Activer votre licence'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('enterLicenseKey') || 'Entrez votre clé de licence reçue par email.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('email')}</Label>
                  <Input
                    placeholder="email@example.com"
                    value={activationEmail}
                    onChange={(e) => setActivationEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('licenseKey') || 'Clé de licence'}</Label>
                  <Input
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => activateSubscription(licenseKey, activationEmail)} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('activate') || 'Activer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Trial Offer */}
          {trialAvailable && !isActive && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Clock className="h-5 w-5" />
                  {t('startTrial') || 'Essai Gratuit 14 Jours'}
                </CardTitle>
                <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                  {t('trialDesc') || 'Profitez de toutes les fonctionnalités Pro gratuitement pendant 14 jours.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Votre email"
                    className="bg-white dark:bg-background"
                    value={trialEmail}
                    onChange={(e) => setTrialEmail(e.target.value)}
                  />
                  <Button onClick={() => startTrial(trialEmail)} disabled={isLoading}>
                    {t('start') || 'Commencer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;