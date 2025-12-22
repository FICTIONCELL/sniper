import { useEffect, useRef } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProjects, useTasks, useReserves } from '@/hooks/useLocalStorage';
import { useTranslation } from '@/contexts/TranslationContext';
import { Project, Task, Reserve } from '@/types';

export const ReminderEngine = () => {
    const { state, addNotification, updateReminderCheck, markThresholdNotified } = useNotification();
    const { subscription, daysRemaining } = useSubscription();
    const [projects] = useProjects();
    const [tasks] = useTasks();
    const [reserves] = useReserves();
    const { t } = useTranslation();

    const checkInterval = useRef<NodeJS.Timeout | null>(null);

    const checkReminders = () => {
        if (!state.notificationsEnabled) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. License Expiry Reminder (< 10 days)
        if (subscription && subscription.status === 'active' && daysRemaining > 0 && daysRemaining <= 10) {
            const lastCheck = state.lastReminderCheck['license_expiry'];
            if (lastCheck !== todayStr) {
                addNotification({
                    type: 'warning',
                    title: t('licenseExpiryTitle') || 'Expiration de licence',
                    description: (t('licenseExpiryDesc') || 'Votre licence expire dans {days} jours.').replace('{days}', daysRemaining.toString()),
                });
                updateReminderCheck('license_expiry', todayStr);
            }
        }

        // 2. Daily Reminders (Unresolved Reserves)
        const unresolvedReserves = reserves.filter(r => r.status !== 'resolue');
        if (unresolvedReserves.length > 0) {
            const lastCheck = state.lastReminderCheck['daily_reserves'];
            if (lastCheck !== todayStr) {
                addNotification({
                    type: 'reservation',
                    title: t('unresolvedReservesTitle') || 'Réserves en attente',
                    description: (t('unresolvedReservesDesc') || 'Vous avez {count} réserves non résolues.').replace('{count}', unresolvedReserves.length.toString()),
                });
                updateReminderCheck('daily_reserves', todayStr);
            }
        }

        // 3. Project Progress Reminders (50%, 30%, 10%, 5% remaining)
        projects.forEach(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            if (projectTasks.length === 0) return;

            const totalProgress = projectTasks.reduce((acc, task) => acc + (task.progress || 0), 0);
            const averageProgress = totalProgress / projectTasks.length;
            const remainingWork = 100 - averageProgress;

            checkThresholds(project.id, project.name, remainingWork, 'project');
        });

        // 4. Task Progress Reminders
        tasks.forEach(task => {
            if (task.status === 'termine') return;

            const remainingWork = 100 - (task.progress || 0);
            checkThresholds(task.id, task.title, remainingWork, 'task');
        });
    };

    const checkThresholds = (id: string, name: string, remaining: number, type: 'project' | 'task') => {
        const thresholds = [50, 30, 10, 5];
        const notified = state.notifiedThresholds[id] || [];

        thresholds.forEach(threshold => {
            // If remaining work is AT or BELOW the threshold, and we haven't notified for this threshold yet
            if (remaining <= threshold && !notified.includes(threshold)) {
                addNotification({
                    type: type === 'project' ? 'info' : 'success',
                    title: type === 'project' ? (t('projectProgressTitle') || 'Progression du projet') : (t('taskProgressTitle') || 'Progression de la tâche'),
                    description: (t('progressReminderDesc') || '{name} : {remaining}% restant.').replace('{name}', name).replace('{remaining}', Math.round(remaining).toString()),
                });
                markThresholdNotified(id, threshold);
            }
        });
    };

    useEffect(() => {
        // Initial check
        checkReminders();

        // Periodic check every hour
        checkInterval.current = setInterval(checkReminders, 1000 * 60 * 60);

        return () => {
            if (checkInterval.current) clearInterval(checkInterval.current);
        };
    }, [state.notificationsEnabled, subscription, projects, tasks, reserves]);

    return null; // This component doesn't render anything
};
