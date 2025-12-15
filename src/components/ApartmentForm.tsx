import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Apartment } from "@/types";
import { useTranslation } from "@/contexts/TranslationContext";

interface ApartmentFormProps {
  onSubmit: (data: Omit<Apartment, 'id' | 'projectId' | 'blockId' | 'createdAt'>) => void;
  initialData?: Partial<Apartment>;
  isEditing?: boolean;
}

export function ApartmentForm({ onSubmit, initialData, isEditing = false }: ApartmentFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    number: initialData?.number || '',
    type: initialData?.type || 'appartement' as Apartment['type'],
    surface: initialData?.surface || 0,
    status: initialData?.status || 'libre' as Apartment['status']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="number">{t('apartmentNumber')}</Label>
        <Input
          id="number"
          value={formData.number}
          onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
          placeholder={t('apartmentNumberPlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">{t('type')}</Label>
        <Select value={formData.type} onValueChange={(value: Apartment['type']) =>
          setFormData(prev => ({ ...prev, type: value }))
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appartement">{t('apartment')}</SelectItem>
            <SelectItem value="villa">{t('villa')}</SelectItem>
            <SelectItem value="studio">{t('studio')}</SelectItem>
            <SelectItem value="duplex">{t('duplex')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="surface">{t('surface')} (m²)</Label>
        <Input
          id="surface"
          type="number"
          min="0"
          step="0.01"
          value={formData.surface}
          onChange={(e) => setFormData(prev => ({ ...prev, surface: parseFloat(e.target.value) || 0 }))}
          placeholder={t('surfacePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">{t('status')}</Label>
        <Select value={formData.status} onValueChange={(value: Apartment['status']) =>
          setFormData(prev => ({ ...prev, status: value }))
        }>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="libre">{t('free')}</SelectItem>
            <SelectItem value="reserve">{t('reserved')}</SelectItem>
            <SelectItem value="vendu">{t('sold')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {isEditing ? t('updateApartment') : t('createApartmentButton')}
      </Button>
    </form>
  );
}