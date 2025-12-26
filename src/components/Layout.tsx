import { AppSidebar } from "@/components/AppSidebar";
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

  return (
    <NotificationProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 md:h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-2 md:px-4 gap-2 md:gap-4 sticky top-0 z-50">
              <SidebarTrigger className="shrink-0 h-9 w-9" />
              <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                <div className="flex items-center gap-2 md:gap-4 flex-1 overflow-hidden">
                  <h1 className="text-base md:text-lg font-semibold truncate">{t('appTitle')}</h1>
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