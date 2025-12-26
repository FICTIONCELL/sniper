import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Contractor } from "@/types";
import { useCategories, useProjects } from "@/hooks/useLocalStorage";
import { useTranslation } from "@/contexts/TranslationContext";

interface ContractorFormProps {
  onSubmit: (data: Omit<Contractor, 'id' | 'createdAt'>) => void;
  initialData?: Omit<Contractor, 'id' | 'createdAt'>;
}

export function ContractorForm({ onSubmit, initialData }: ContractorFormProps) {
  const { t } = useTranslation();
  const [categories] = useCategories();
  const [projects] = useProjects();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    specialty: initialData?.specialty || '',
    projectId: initialData?.projectId || '',
    categoryIds: initialData?.categoryIds || [],
    contractStart: initialData?.contractStart || '',
    contractEnd: initialData?.contractEnd || '',
    status: initialData?.status || 'actif' as const,
    subcontractorId: initialData?.subcontractorId || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('contractorName')}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t('contractorNamePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="email@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('phone')}</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="0123456789"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialty">{t('specialty')}</Label>
        <Input
          id="specialty"
          value={formData.specialty}
          onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
          placeholder={t('specialtyPlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">{t('project')}</Label>
        <Select
          value={formData.projectId}
          onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectProject')} />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('categories')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map(category => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={formData.categoryIds.includes(category.id)}
                onCheckedChange={() => handleCategoryChange(category.id)}
              />
              <Label htmlFor={`category-${category.id}`} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractStart">{t('contractStart')}</Label>
          <Input
            id="contractStart"
            type="date"
            value={formData.contractStart}
            onChange={(e) => setFormData(prev => ({ ...prev, contractStart: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractEnd">{t('contractEnd')}</Label>
          <Input
            id="contractEnd"
            type="date"
            value={formData.contractEnd}
            onChange={(e) => setFormData(prev => ({ ...prev, contractEnd: e.target.value }))}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {t('addContractorButton')}
      </Button>
    </form>
  );
}