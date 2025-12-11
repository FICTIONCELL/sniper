import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  Sun,
  Moon,
  Monitor,
  Minimize2,
  Cloud,
  CloudOff,
  Loader2,
  Box
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TopBarProps {
  onCompactModeToggle: () => void;
  isCompactMode: boolean;
}

export const TopBar = ({
  onCompactModeToggle,
  isCompactMode
}: TopBarProps) => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isAuthenticated, login, isSyncing, pendingSync, syncData, lastSynced } = useGoogleDrive();

  const [is3DMode, setIs3DMode] = useState(() => {
    return localStorage.getItem('theme-3d') === 'true';
  });

  useEffect(() => {
    if (is3DMode) {
      document.body.classList.add('theme-3d');
    } else {
      document.body.classList.remove('theme-3d');
    }
    localStorage.setItem('theme-3d', String(is3DMode));
  }, [is3DMode]);

  const toggle3DMode = () => {
    setIs3DMode(!is3DMode);
    toast({
      title: is3DMode ? "Mode 3D désactivé" : "Mode 3D activé",
      description: is3DMode ? "Retour au style plat standard." : "Profitez des effets de profondeur et d'animation.",
    });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: t('theme'),
      description: `${t('theme')} ${newTheme === 'dark' ? t('darkTheme') : newTheme === 'light' ? t('lightTheme') : t('systemTheme')} ${t('activated')}`,
      duration: 2000,
    });
  };

  const handleCompactModeToggle = () => {
    onCompactModeToggle();
    // Naviguer vers le mode compact
    window.location.href = '/compact';
    toast({
      title: t('compactMode'),
      description: t('compactModeDesc'),
      duration: 2000,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Cloud Sync Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isAuthenticated ? "outline" : "ghost"}
            size="sm"
            onClick={() => isAuthenticated ? syncData() : login()}
            disabled={isSyncing}
            className={
              isAuthenticated
                ? pendingSync
                  ? "text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                  : "text-green-600 border-green-200 hover:bg-green-50"
                : "text-muted-foreground"
            }
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAuthenticated ? (
              <Cloud className="h-4 w-4" />
            ) : (
              <CloudOff className="h-4 w-4" />
            )}
            <span className="sr-only">{t('googleDrive')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isAuthenticated ? (
            <p>
              {pendingSync ? "Sauvegarde en attente..." : t('connected')}
              {!pendingSync && lastSynced && ` - ${t('lastSynced')}: ${lastSynced.toLocaleTimeString()}`}
            </p>
          ) : (
            <p>{t('connect')}</p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* 3D Mode Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={is3DMode ? "default" : "outline"}
            size="sm"
            onClick={toggle3DMode}
            className="relative"
          >
            <Box className="h-4 w-4" />
            <span className="sr-only">Mode 3D</span>
            {is3DMode && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full bg-primary"
              />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{is3DMode ? "Désactiver la 3D" : "Activer la 3D"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Compact Mode Toggle */}
      <Button
        variant={isCompactMode ? "default" : "outline"}
        size="sm"
        onClick={handleCompactModeToggle}
        className="relative gap-2"
      >
        <Minimize2 className="h-4 w-4" />
        {t('compactMode')}
        {isCompactMode && (
          <Badge
            variant="secondary"
            className="absolute -top-1 -right-1 h-2 w-2 p-0 rounded-full bg-primary"
          />
        )}
      </Button>

      {/* Theme Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleThemeChange('light')}>
            <Sun className="mr-2 h-4 w-4" />
            {t('lightTheme')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            {t('darkTheme')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange('system')}>
            <Monitor className="mr-2 h-4 w-4" />
            {t('systemTheme')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Enhanced Notification Center */}
      <NotificationCenter />
    </div>
  );
};