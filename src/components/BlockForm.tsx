import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Block } from "@/types";
import { useTranslation } from "@/contexts/TranslationContext";

interface BlockFormProps {
  onSubmit: (data: Omit<Block, 'id' | 'projectId' | 'createdAt'>) => void;
  initialData?: Partial<Block>;
  isEditing?: boolean;
}

export function BlockForm({ onSubmit, initialData, isEditing = false }: BlockFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('blockName')}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t('blockNamePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={t('blockDescriptionPlaceholder')}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        {isEditing ? t('updateBlock') : t('createBlockButton')}
      </Button>
    </form>
  );
}