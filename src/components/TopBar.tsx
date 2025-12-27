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
  Search,
  Type,
  LogOut,
  User,
  Settings,
  MoreVertical,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
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
  const { isAuthenticated, login, logout, isSyncing, pendingSync, syncData, lastSynced, user } = useGoogleDrive();
  const { search } = useGlobalSearch();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [textSize, setTextSize] = useState(100);

  useEffect(() => {
    const results = search(searchQuery);
    setSearchResults(results);
  }, [searchQuery]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize}%`;
  }, [textSize]);

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
      {/* Search Button (Always Visible) */}
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

      {/* Quick Access Button (faire vite) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 px-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
            onClick={() => navigate('/compact')}
          >
            <Zap className="h-4 w-4 fill-current" />
            <span className="sr-only">faire vite</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>faire vite</p>
        </TooltipContent>
      </Tooltip>

      {/* Cloud Sync / User Profile Button (Always Visible) */}
      {isAuthenticated && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}</AvatarFallback>
              </Avatar>
              {pendingSync && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-yellow-500 border-2 border-background" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => syncData()} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="mr-2 h-4 w-4" />
              )}
              <span>{isSyncing ? "Synchronisation..." : t('syncNow')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('disconnect')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => login()}
              className="text-muted-foreground hover:text-primary"
            >
              <CloudOff className="h-4 w-4" />
              <span className="sr-only">{t('connect')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('connect')}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Desktop Only Actions */}
      <div className="hidden md:flex items-center gap-2">
        {/* Text Size Control */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 px-0">
              <Type className="h-4 w-4" />
              <span className="sr-only">Taille du texte</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Taille du texte</h4>
              <div className="flex items-center gap-4">
                <span className="text-sm">A-</span>
                <Slider
                  value={[textSize]}
                  min={80}
                  max={150}
                  step={5}
                  onValueChange={(value) => setTextSize(value[0])}
                  className="flex-1"
                />
                <span className="text-lg font-bold">A+</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">{textSize}%</p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Compact Mode Toggle */}
        <Button
          variant={isCompactMode ? "default" : "outline"}
          size="sm"
          onClick={handleCompactModeToggle}
          className="relative gap-2 px-3"
        >
          <Minimize2 className="h-4 w-4" />
          <span className="hidden sm:inline">{t('compactMode')}</span>
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
      </div>

      {/* Mobile Overflow Menu */}
      <div className="flex md:hidden items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 px-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Plus d'actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Text Size in Mobile Dropdown */}
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-2 w-full py-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taille du texte</span>
                  <span className="text-xs text-muted-foreground">{textSize}%</span>
                </div>
                <Slider
                  value={[textSize]}
                  min={80}
                  max={150}
                  step={5}
                  onValueChange={(value) => setTextSize(value[0])}
                  className="w-full"
                />
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Compact Mode in Mobile Dropdown */}
            <DropdownMenuItem onClick={handleCompactModeToggle}>
              <Minimize2 className="mr-2 h-4 w-4" />
              <span>{t('compactMode')}</span>
              {isCompactMode && <Badge variant="secondary" className="ml-auto h-2 w-2 p-0 rounded-full bg-primary" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Theme in Mobile Dropdown */}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Thème</DropdownMenuLabel>
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
      </div>

      {/* Enhanced Notification Center (Always Visible) */}
      <NotificationCenter />
    </div>
  );
};