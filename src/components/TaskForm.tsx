import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useLocalStorage";
import { Task } from "@/types";
import { useTranslation } from "@/contexts/TranslationContext";

interface TaskFormProps {
  onSubmit: (data: Omit<Task, 'id' | 'createdAt'>) => void;
  initialData?: Partial<Task>;
  isEditing?: boolean;
}

export function TaskForm({ onSubmit, initialData, isEditing = false }: TaskFormProps) {
  const { t } = useTranslation();
  const [projects] = useProjects();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
    duration: 1,
    status: 'en_attente' as Task['status'],
    priority: 'normal' as Task['priority'],
    progress: 0,
    dependencies: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure status and priority are valid types if they come from initialData
        status: (initialData.status as Task['status']) || 'en_attente',
        priority: (initialData.priority as Task['priority']) || 'normal',
      }));
    }
  }, [initialData]);

  // Auto-calculate duration when start or end date changes
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      // Calculate difference in days
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Ensure duration is at least 1 day
      const calculatedDuration = Math.max(1, diffDays);

      setFormData(prev => ({ ...prev, duration: calculatedDuration }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('title')} *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder={t('title')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{t('description')}</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={t('description')}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('project')} *</Label>
          <Select value={formData.projectId} onValueChange={(value) =>
            setFormData(prev => ({ ...prev, projectId: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder={t('project')} />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('assignedTo')}</Label>
          <Input
            value={formData.assignedTo}
            onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
            placeholder={t('assignedTo')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('startDate')} *</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t('endDate')} *</Label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('duration')} ({t('days') || 'jours'})</Label>
          <Input
            type="number"
            min="1"
            value={formData.duration}
            disabled
            className="bg-muted cursor-not-allowed"
            title={t('durationAutoCalculated') || 'Durée calculée automatiquement'}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('autoCalculated') || 'Calculé automatiquement'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t('priority')}</Label>
          <Select value={formData.priority} onValueChange={(value: Task['priority']) =>
            setFormData(prev => ({ ...prev, priority: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">{t('urgent')}</SelectItem>
              <SelectItem value="normal">{t('normal')}</SelectItem>
              <SelectItem value="faible">{t('low')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {isEditing ? t('updateTask') : t('createTask')}
      </Button>
    </form>
  );
}