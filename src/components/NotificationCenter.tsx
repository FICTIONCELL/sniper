import { Bell, BellOff, X, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/contexts/NotificationContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS, ar, es } from 'date-fns/locale';

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
        <Button variant="outline" size="sm" className="relative">
          {state.unreadCount > 0 ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          {state.unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full text-xs flex items-center justify-center"
            >
              {state.unreadCount > 9 ? '9+' : state.unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{t('notificationTitle')}</h3>
          <div className="flex items-center gap-2">
            {state.unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                {t('notificationMarkAllRead')}
              </Button>
            )}
            {state.notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t('notificationClearAll')}
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {state.notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {t('notificationEmpty')}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {state.notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all ${!notification.read
                      ? 'bg-primary/5 border-primary/20'
                      : 'hover:bg-muted/50'
                    }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <h4 className={`text-sm font-medium truncate ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs h-5 px-1">
                              {t('notificationNew')}
                            </Badge>
                          )}
                        </div>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                              locale
                            })}
                          </span>
                          {notification.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action?.onClick();
                                markAsRead(notification.id);
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Notification Settings */}
        <div className="p-4 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Settings className="h-3 w-3" />
            {t('notificationSettings')}
          </h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-notifications" className="text-xs">
                {t('notificationSound')}
              </Label>
              <Switch
                id="sound-notifications"
                checked={state.soundEnabled}
                onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="browser-notifications" className="text-xs">
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
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-delete" className="text-xs">
                {t('notificationAutoDelete')}
              </Label>
              <Switch
                id="auto-delete"
                checked={state.autoDelete}
                onCheckedChange={(checked) => updateSettings({ autoDelete: checked })}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}