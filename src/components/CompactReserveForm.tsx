import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, Save, Image as ImageIcon } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { useProjects, useBlocks, useApartments, useCategories, useContractors, useReserves } from "@/hooks/useLocalStorage";
import { Reserve } from "@/types";
import { useTranslation } from "@/contexts/TranslationContext";

const reserveSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  projectId: z.string().min(1, "Le projet est requis"),
  blockId: z.string().optional(),
  apartmentId: z.string().optional(),
  categoryId: z.string().min(1, "La catégorie est requise"),
  contractorId: z.string().min(1, "Le sous-traitant est requis"),
  priority: z.enum(["urgent", "normal", "faible"]),
  status: z.enum(["ouverte", "en_cours", "resolue"]),
});

type ReserveFormData = z.infer<typeof reserveSchema>;

interface CompactReserveFormProps {
  onSubmit: (data: Omit<Reserve, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const CompactReserveForm = ({ onSubmit, onClose }: CompactReserveFormProps) => {
  const { t } = useTranslation();
  const [projects] = useProjects();
  const [blocks] = useBlocks();
  const [apartments] = useApartments();
  const [categories] = useCategories();
  const [contractors] = useContractors();
  const [reserves] = useReserves();
  const [images, setImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReserveFormData>({
    resolver: zodResolver(reserveSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId: "",
      blockId: "",
      apartmentId: "",
      categoryId: "",
      contractorId: "",
      priority: "normal",
      status: "ouverte",
    },
  });

  const selectedProjectId = form.watch("projectId");
  const selectedBlockId = form.watch("blockId");
  const selectedCategoryId = form.watch("categoryId");
  const selectedContractorId = form.watch("contractorId");

  const availableBlocks = blocks.filter(block => block.projectId === selectedProjectId);
  const availableApartments = apartments.filter(apartment => apartment.blockId === selectedBlockId);

  const getFilteredCategories = () => {
    // Montrer toutes les catégories disponibles
    return categories;
  };

  const getFilteredContractors = () => {
    let filtered = contractors;

    // Filtrer par projet sélectionné
    if (selectedProjectId) {
      filtered = filtered.filter(c => c.projectId === selectedProjectId);
    }

    // Filtrer par catégorie sélectionnée
    if (selectedCategoryId) {
      filtered = filtered.filter(c => c.categoryIds?.includes(selectedCategoryId));
    }

    return filtered;
  };

  const getFilteredProjects = () => {
    if (!selectedContractorId && !selectedCategoryId) return projects;

    let projectIds = new Set<string>();

    if (selectedContractorId) {
      const contractor = contractors.find(c => c.id === selectedContractorId);
      if (contractor) {
        projectIds.add(contractor.projectId);
      }
    }

    if (selectedCategoryId) {
      const categoryReserves = reserves.filter(r => r.categoryId === selectedCategoryId);
      categoryReserves.forEach(r => projectIds.add(r.projectId));
    }

    return projects.filter(p => projectIds.has(p.id));
  };

  const handleSubmit = (data: ReserveFormData) => {
    const reserveData: Omit<Reserve, 'id' | 'createdAt'> = {
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      blockId: data.blockId === "none" ? undefined : data.blockId,
      apartmentId: data.apartmentId === "none" ? undefined : data.apartmentId,
      categoryId: data.categoryId,
      contractorId: data.contractorId,
      priority: data.priority,
      status: data.status,
      images,
    };
    onSubmit(reserveData);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPendingFiles(prev => [...prev, ...files]);

      const readers = files.map(file => {
        const reader = new FileReader();
        return new Promise<string>((resolve) => {
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(newImages => {
        setImages(prev => [...prev, ...newImages]);
      });
    }
  };

  const handleCameraCapture = (file: File) => {
    setPendingFiles(prev => [...prev, file]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setImages(prev => [...prev, imageUrl]);
    };
    reader.readAsDataURL(file);
    setShowCamera(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'faible': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ouverte': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'en_cours': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'resolue': return 'bg-green-500/10 text-green-700 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('newReserveTitle')}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Row 1: Title and Project */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('reserveTitleLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('reserveTitleExample')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('projectEmojiLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedContractorId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectProjectPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getFilteredProjects().length > 0 ? getFilteredProjects().map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        )) : projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Block and Apartment */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="blockId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('blockEmojiLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedProjectId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectBlockPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('noBlock')}</SelectItem>
                        {availableBlocks.map((block) => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apartmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('apartmentEmojiLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBlockId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('apartmentNumberPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('noApartment')}</SelectItem>
                        {availableApartments.map((apartment) => (
                          <SelectItem key={apartment.id} value={apartment.id}>
                            {apartment.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Category and Contractor */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('categoryEmojiLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedProjectId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('workTypePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getFilteredCategories().map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contractorEmojiLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedProjectId && !selectedCategoryId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('assignedToPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getFilteredContractors().map((contractor) => (
                          <SelectItem key={contractor.id} value={contractor.id}>
                            {contractor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Priority and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('priorityEmojiLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="urgent">
                          <Badge className={getPriorityColor('urgent')} variant="outline">
                            {t('urgent')}
                          </Badge>
                        </SelectItem>
                        <SelectItem value="normal">
                          <Badge className={getPriorityColor('normal')} variant="outline">
                            {t('normal')}
                          </Badge>
                        </SelectItem>
                        <SelectItem value="faible">
                          <Badge className={getPriorityColor('faible')} variant="outline">
                            {t('low')}
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('statusLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ouverte">
                          <Badge className={getStatusColor('ouverte')} variant="outline">
                            {t('openStatus')}
                          </Badge>
                        </SelectItem>
                        <SelectItem value="en_cours">
                          <Badge className={getStatusColor('en_cours')} variant="outline">
                            {t('inProgress')}
                          </Badge>
                        </SelectItem>
                        <SelectItem value="resolue">
                          <Badge className={getStatusColor('resolue')} variant="outline">
                            {t('resolvedStatus')}
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('descriptionEmojiLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('reserveDescriptionPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photos */}
            <div className="space-y-2">
              <FormLabel>{t('photosEmojiLabel')}</FormLabel>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Photo ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                multiple
                accept="image/*"
                aria-label="Ajouter des photos"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(true)}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {t('takePhoto') || 'Prendre une photo'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {t('chooseFromGallery') || 'Choisir depuis la galerie'}
                </Button>
              </div>

              {/* Camera Dialog */}
              <Dialog open={showCamera} onOpenChange={setShowCamera}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('takePhoto') || 'Prendre une photo'}</DialogTitle>
                  </DialogHeader>
                  <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('cancelButton')}
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {t('saveButton')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};