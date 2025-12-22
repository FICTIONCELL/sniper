import { useEffect, useRef } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProjects, useTasks, useReserves, useContractors } from '@/hooks/useLocalStorage';
import { useTranslation } from '@/contexts/TranslationContext';

export const ReminderEngine = () => {
    const { state, addNotification, updateReminderCheck, markThresholdNotified } = useNotification();
    const { subscription, daysRemaining } = useSubscription();
    const [projects] = useProjects();
    const [tasks] = useTasks();
    const [reserves] = useReserves();
    const [contractors] = useContractors();
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
                    title: t('licenseExpiryTitle'),
                    description: t('licenseExpiryDesc', { days: daysRemaining }),
                });
                updateReminderCheck('license_expiry', todayStr);
            }
        }

        // 2. Daily Reminders (Unresolved Reserves)
        const unresolvedReserves = reserves.filter(r => r.status !== 'resolue');
        if (unresolvedReserves.length > 0) {
            const lastCheck = state.lastReminderCheck['daily_reserves'];
            if (lastCheck !== todayStr) {
                // Find most urgent or recent unresolved reserves
                const recentReserves = unresolvedReserves.slice(0, 3).map(r => r.title).join(', ');
                const description = unresolvedReserves.length > 3
                    ? t('unresolvedReservesDesc', { count: unresolvedReserves.length }) + ` (${recentReserves}...)`
                    : t('unresolvedReservesDesc', { count: unresolvedReserves.length }) + ` (${recentReserves})`;

                addNotification({
                    type: 'reservation',
                    title: t('unresolvedReservesTitle'),
                    description: description,
                });
                updateReminderCheck('daily_reserves', todayStr);
            }
        }

        // 3. Project Progress & Latency
        projects.forEach(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);

            // Check for latency
            if (project.endDate && new Date(project.endDate) < now && project.status !== 'termine') {
                const lastCheck = state.lastReminderCheck[`late_project_${project.id}`];
                if (lastCheck !== todayStr) {
                    addNotification({
                        type: 'error',
                        title: t('lateProjectTitle'),
                        description: t('lateProjectDesc', { name: project.name }),
                    });
                    updateReminderCheck(`late_project_${project.id}`, todayStr);
                }
            }

            if (projectTasks.length === 0) return;

            const totalProgress = projectTasks.reduce((acc, task) => acc + (task.progress || 0), 0);
            const averageProgress = totalProgress / projectTasks.length;
            const remainingWork = 100 - averageProgress;

            checkThresholds(project.id, project.name, remainingWork, 'project');
        });

        // 4. Task Progress & Latency
        tasks.forEach(task => {
            if (task.status === 'termine') return;

            // Check for latency
            if (task.endDate && new Date(task.endDate) < now) {
                const lastCheck = state.lastReminderCheck[`late_task_${task.id}`];
                if (lastCheck !== todayStr) {
                    const diffDays = Math.ceil((now.getTime() - new Date(task.endDate).getTime()) / (1000 * 60 * 60 * 24));
                    addNotification({
                        type: 'error',
                        title: t('lateTaskTitle'),
                        description: t('lateTaskDesc', { name: task.title, days: diffDays }),
                    });
                    updateReminderCheck(`late_task_${task.id}`, todayStr);
                }
            }

            const remainingWork = 100 - (task.progress || 0);
            checkThresholds(task.id, task.title, remainingWork, 'task');
        });

        // 5. Contractor Contract Expiry
        contractors.forEach(contractor => {
            if (!contractor.contractEnd) return;
            const endDate = new Date(contractor.contractEnd);
            const diffTime = endDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 10 && diffDays > 0) {
                const lastCheck = state.lastReminderCheck[`contract_expiry_${contractor.id}`];
                if (lastCheck !== todayStr) {
                    addNotification({
                        type: 'warning',
                        title: t('contractExpiryTitle'),
                        description: t('contractExpiryDesc', { name: contractor.name, days: diffDays }),
                    });
                    updateReminderCheck(`contract_expiry_${contractor.id}`, todayStr);
                }
            } else if (diffDays <= 0) {
                const lastCheck = state.lastReminderCheck[`contract_expired_${contractor.id}`];
                if (lastCheck !== todayStr) {
                    addNotification({
                        type: 'error',
                        title: t('contractExpiredTitle'),
                        description: t('contractExpiredDesc', { name: contractor.name, days: Math.abs(diffDays) }),
                    });
                    updateReminderCheck(`contract_expired_${contractor.id}`, todayStr);
                }
            }
        });
    };

    const checkThresholds = (id: string, name: string, remaining: number, type: 'project' | 'task') => {
        const thresholds = [50, 30, 10, 5];
        const notified = state.notifiedThresholds[id] || [];

        thresholds.forEach(threshold => {
            if (remaining <= threshold && !notified.includes(threshold)) {
                addNotification({
                    type: type === 'project' ? 'info' : 'success',
                    title: type === 'project' ? t('projectProgressTitle') : t('taskProgressTitle'),
                    description: t('progressReminderDesc', { name, remaining: Math.round(remaining) }),
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
    }, [state.notificationsEnabled, subscription, projects, tasks, reserves, contractors]);

    return null;
};
