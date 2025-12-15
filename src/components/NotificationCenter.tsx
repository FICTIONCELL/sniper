import { Bell, BellOff, X, Check, CheckCheck, Trash2, Settings, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/contexts/NotificationContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS, ar, es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const localeMap = {
  fr,
  en: enUS,
  ar,
  es,
};

export function NotificationCenter() {
  const { state, markAsRead, markAllAsRead, deleteNotification, clearAll, updateSettings, requestPermission } = useNotification();
  const { t, language } = useTranslation();

  const locale = localeMap[language as keyof typeof localeMap] || fr;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'reservation': return '📋';
      case 'reception': return '📦';
      default: return '💡';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'reservation': return 'text-blue-600 dark:text-blue-400';
      case 'reception': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted transition-colors">
          {state.unreadCount > 0 ? (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: 0, repeatDelay: 5 }}
            >
              <Bell className="h-5 w-5 text-primary" />
            </motion.div>
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          {state.unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full text-[10px] flex items-center justify-center border-2 border-background animate-in zoom-in"
            >
              {state.unreadCount > 9 ? '9+' : state.unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 shadow-xl border-border/50 backdrop-blur-sm bg-background/95" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{t('notificationTitle')}</h3>
            <Badge variant="secondary" className="text-xs font-normal">
              {state.notifications.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {state.unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={markAllAsRead}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                title={t('notificationMarkAllRead')}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {state.notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title={t('notificationClearAll')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {state.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-4">
              <div className="bg-muted/50 p-4 rounded-full">
                <Inbox className="h-8 w-8 opacity-50" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{t('notificationEmpty')}</p>
                <p className="text-xs text-muted-foreground/70">Vous êtes à jour !</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              <AnimatePresence mode='popLayout'>
                {state.notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`group relative overflow-hidden transition-all border-l-4 ${!notification.read
                        ? 'bg-primary/5 border-l-primary border-y-transparent border-r-transparent'
                        : 'hover:bg-muted/50 border-l-transparent border-transparent'
                        }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="text-xl mt-0.5 select-none">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium leading-none ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                {formatDistanceToNow(notification.timestamp, {
                                  addSuffix: true,
                                  locale
                                })}
                              </span>
                            </div>

                            {notification.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {notification.description}
                              </p>
                            )}

                            {notification.action && (
                              <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 w-full justify-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notification.action?.onClick();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  {notification.action.label}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-background/80 backdrop-blur-sm rounded-md p-0.5 shadow-sm">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              title="Marquer comme lu"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            title="Supprimer"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Notification Settings */}
        <div className="p-4 bg-muted/10">
          <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings className="h-3 w-3" />
            {t('notificationSettings')}
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-notifications" className="text-xs font-normal cursor-pointer">
                {t('notificationSound')}
              </Label>
              <Switch
                id="sound-notifications"
                checked={state.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                className="scale-75 origin-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="browser-notifications" className="text-xs font-normal cursor-pointer">
                {t('notificationBrowser')}
              </Label>
              <Switch
                id="browser-notifications"
                checked={state.browserNotifications}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestPermission();
                  } else {
                    updateSettings({ browserNotifications: false });
                  }
                }}
                className="scale-75 origin-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-delete" className="text-xs font-normal cursor-pointer">
                {t('notificationAutoDelete')}
              </Label>
              <Switch
                id="auto-delete"
                checked={state.autoDelete}
                onCheckedChange={(checked) => updateSettings({ autoDelete: checked })}
                className="scale-75 origin-right"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}