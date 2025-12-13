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
  Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useGoogleDrive } from "@/contexts/GoogleDriveContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { useNavigate } from "react-router-dom";

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
  const { search } = useGlobalSearch();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const results = search(searchQuery);
    setSearchResults(results);
  }, [searchQuery]);

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

  const handleResultClick = (url: string) => {
    navigate(url);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search Button */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 px-0">
            <Search className="h-4 w-4" />
            <span className="sr-only">{t('search')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('search')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder={t('searchPlaceholder') || "Rechercher..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="col-span-3"
              autoFocus
            />
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {searchResults.length === 0 && searchQuery.length > 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noResults') || "Aucun résultat trouvé"}
                </p>
              )}
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result.url)}
                >
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <result.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{result.title}</p>
                    <p className="text-xs text-muted-foreground">{result.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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