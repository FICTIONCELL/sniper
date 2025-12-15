import { useProjects, useReserves, useTasks, useContractors, useReceptions } from "@/hooks/useLocalStorage";
import { useTranslation } from "@/contexts/TranslationContext";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle, AlertTriangle, Users, Calendar } from "lucide-react";

export interface SearchResult {
    id: string;
    title: string;
    description: string;
    type: 'project' | 'task' | 'reserve' | 'contractor' | 'reception';
    url: string;
    icon: any;
}

export const useGlobalSearch = () => {
    const [projects] = useProjects();
    const [reserves] = useReserves();
    const [tasks] = useTasks();
    const [contractors] = useContractors();
    const [receptions] = useReceptions();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const search = (query: string): SearchResult[] => {
        if (!query || query.trim().length === 0) return [];

        const lowerQuery = query.toLowerCase();
        const results: SearchResult[] = [];

        // Search Projects
        projects.forEach(project => {
            if (project.name.toLowerCase().includes(lowerQuery) ||
                project.description?.toLowerCase().includes(lowerQuery)) {
                results.push({
                    id: project.id,
                    title: project.name,
                    description: t('project'),
                    type: 'project',
                    url: `/projects/${project.id}`,
                    icon: Building2
                });
            }
        });

        // Search Tasks
        tasks.forEach(task => {
            if (task.title.toLowerCase().includes(lowerQuery) ||
                task.description?.toLowerCase().includes(lowerQuery)) {
                results.push({
                    id: task.id,
                    title: task.title,
                    description: t('task'),
                    type: 'task',
                    url: '/tasks',
                    icon: CheckCircle
                });
            }
        });

        // Search Reserves
        reserves.forEach(reserve => {
            if (reserve.title.toLowerCase().includes(lowerQuery) ||
                reserve.description?.toLowerCase().includes(lowerQuery)) {
                results.push({
                    id: reserve.id,
                    title: reserve.title,
                    description: `${t('reserve')} - ${reserve.priority}`,
                    type: 'reserve',
                    url: '/reserves',
                    icon: AlertTriangle
                });
            }
        });

        // Search Contractors
        contractors.forEach(contractor => {
            if (contractor.name.toLowerCase().includes(lowerQuery) ||
                contractor.email?.toLowerCase().includes(lowerQuery) ||
                contractor.specialty?.toLowerCase().includes(lowerQuery)) {
                results.push({
                    id: contractor.id,
                    title: contractor.name,
                    description: contractor.specialty || t('contractor'),
                    type: 'contractor',
                    url: '/contractors',
                    icon: Users
                });
            }
        });

        // Search Receptions
        receptions.forEach(reception => {
            if (reception.id.toLowerCase().includes(lowerQuery)) {
                results.push({
                    id: reception.id,
                    title: `${t('reception')} #${reception.id.slice(0, 8)}`,
                    description: new Date(reception.date).toLocaleDateString(),
                    type: 'reception',
                    url: '/receptions',
                    icon: Calendar
                });
            }
        });

        return results;
    };

    return { search };
};
