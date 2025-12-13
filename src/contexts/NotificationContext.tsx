import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from './TranslationContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reservation' | 'reception';
  title: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  soundEnabled: boolean;
  toastsEnabled: boolean;
  notificationsEnabled: boolean; // Master switch
  browserNotifications: boolean;
  autoDelete: boolean;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; notification: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_AS_READ'; id: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; id: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Pick<NotificationState, 'soundEnabled' | 'toastsEnabled' | 'notificationsEnabled' | 'browserNotifications' | 'autoDelete'>> }
  | { type: 'LOAD_NOTIFICATIONS'; notifications: Notification[] };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  soundEnabled: true,
  toastsEnabled: true,
  notificationsEnabled: true,
  browserNotifications: false,
  autoDelete: true,
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification: Notification = {
        ...action.notification,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        read: false,
      };

      const notifications = [newNotification, ...state.notifications];

      // Auto-delete old notifications if enabled (keep last 50)
      const filteredNotifications = state.autoDelete
        ? notifications.slice(0, 50)
        : notifications;

      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length,
      };
    }

    case 'MARK_AS_READ': {
      const notifications = state.notifications.map(n =>
        n.id === action.id ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }

    case 'MARK_ALL_AS_READ': {
      const notifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications,
        unreadCount: 0,
      };
    }

    case 'DELETE_NOTIFICATION': {
      const notifications = state.notifications.filter(n => n.id !== action.id);
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    }

    case 'CLEAR_ALL': {
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        ...action.settings,
      };
    }

    case 'LOAD_NOTIFICATIONS': {
      return {
        ...state,
        notifications: action.notifications,
        unreadCount: action.notifications.filter(n => !n.read).length,
      };
    }

    default:
      return state;
  }
}

interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<Pick<NotificationState, 'soundEnabled' | 'toastsEnabled' | 'notificationsEnabled' | 'browserNotifications' | 'autoDelete'>>) => void;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Initialize Local Notifications
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.createChannel({
        id: 'default',
        name: 'Default',
        importance: 5,
        description: 'General Notifications',
        sound: 'alert.mp3',
        visibility: 1,
        vibration: true,
      }).then(() => console.log('Notification channel created'))
        .catch(err => console.error('Error creating notification channel', err));

      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed', notification);
        // Handle navigation or action here if needed
      });
    }
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        dispatch({ type: 'LOAD_NOTIFICATIONS', notifications });
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }

    const settings = localStorage.getItem('notificationSettings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        dispatch({ type: 'UPDATE_SETTINGS', settings: parsedSettings });
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(state.notifications));
  }, [state.notifications]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify({
      soundEnabled: state.soundEnabled,
      toastsEnabled: state.toastsEnabled,
      notificationsEnabled: state.notificationsEnabled,
      browserNotifications: state.browserNotifications,
      autoDelete: state.autoDelete,
    }));
  }, [state.soundEnabled, state.toastsEnabled, state.notificationsEnabled, state.browserNotifications, state.autoDelete]);

  const playNotificationSound = async () => {
    if (state.soundEnabled && state.notificationsEnabled) {
      try {
        const audio = new Audio('/alert.mp3');
        audio.volume = 0.5;
        await audio.play();
      } catch (error) {
        console.error("Failed to play notification sound", error);
      }
    }
  };

  const showNativeNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (Capacitor.isNativePlatform() && state.notificationsEnabled) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: notification.title,
              body: notification.description || '',
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 100) },
              sound: 'alert.mp3',
              attachments: [],
              actionTypeId: '',
              extra: null
            }
          ]
        });
      } catch (error) {
        console.error("Error scheduling native notification", error);
      }
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if (state.browserNotifications && 'Notification' in window && Notification.permission === 'granted' && !Capacitor.isNativePlatform()) {
      const browserNotification = new Notification(notification.title, {
        body: notification.description,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
      });

      browserNotification.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        browserNotification.close();
      };

      setTimeout(() => browserNotification.close(), 5000);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Master switch check
    if (!state.notificationsEnabled) return;

    dispatch({ type: 'ADD_NOTIFICATION', notification });

    // Show toast notification if enabled
    if (state.toastsEnabled) {
      const toastVariant = notification.type === 'error' ? 'destructive' : 'default';
      toast({
        variant: toastVariant,
        title: notification.title,
        description: notification.description,
      });
    }

    // Play sound (web only, native handled by LocalNotifications)
    if (!Capacitor.isNativePlatform()) {
      playNotificationSound();
    }

    // Show Native Notification (Android/iOS)
    showNativeNotification(notification);

    // Add the notification to the new notification object for browser notification
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };
    showBrowserNotification(newNotification);
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const deleteNotification = (id: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const updateSettings = (settings: Partial<Pick<NotificationState, 'soundEnabled' | 'browserNotifications' | 'autoDelete'>>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  };

  const requestPermission = async (): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    }

    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';

    if (granted) {
      updateSettings({ browserNotifications: true });
      toast({
        title: t('notificationPermissionGranted'),
        description: t('notificationPermissionGrantedDesc'),
      });
    }

    return granted;
  };

  return (
    <NotificationContext.Provider
      value={{
        state,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        updateSettings,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
