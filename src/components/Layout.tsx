import { AppSidebar } from "@/components/AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { TopBar } from "@/components/TopBar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useTranslation } from "@/contexts/TranslationContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCompactMode, setIsCompactMode] = useLocalStorage("compactMode", false);
  const { t } = useTranslation();

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // Implement global search logic here
  };

  return (
    <NotificationProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-3 md:px-4 gap-2 md:gap-4 sticky top-0 z-10">
              <SidebarTrigger className="shrink-0" />
              <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-2 md:gap-4 flex-1 overflow-hidden">
                  <h1 className="text-lg font-semibold truncate hidden md:block">{t('appTitle')}</h1>
                  <div className="flex-1 max-w-md">
                    <SearchBar onSearch={handleSearch} />
                  </div>
                </div>
                <TopBar
                  onCompactModeToggle={() => setIsCompactMode(!isCompactMode)}
                  isCompactMode={isCompactMode}
                />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </NotificationProvider>
  );
}