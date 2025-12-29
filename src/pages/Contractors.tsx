import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown, Mail, Phone, Briefcase, Calendar, User, FolderKey, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { useCategories, useProjects, useSubcontractors } from "@/hooks/useLocalStorage";
import { useTranslation } from "@/contexts/TranslationContext";
import { Contractor } from "@/types";

// Validation Schema
const formSchema = z.object({
  name: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  specialty: z.string().min(2, "Spécialité requise"),
  projectId: z.string().min(1, "Veuillez choisir un projet"),
  categoryIds: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie"),
  contractStart: z.string().min(1, "Date de début requise"),
  contractEnd: z.string().min(1, "Date de fin requise"),
  status: z.enum(["actif", "expire", "suspendu"]),
  subcontractorId: z.string().optional(),
});

interface ContractorFormProps {
  onSubmit: (data: Omit<Contractor, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  initialData?: Omit<Contractor, 'id' | 'createdAt'>;
}

export function ContractorForm({ onSubmit, onCancel, initialData }: ContractorFormProps) {
  const { t } = useTranslation();
  const [categories] = useCategories();
  const [projects] = useProjects();
  const [subcontractors] = useSubcontractors();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      specialty: initialData?.specialty || '',
      projectId: initialData?.projectId || '',
      categoryIds: initialData?.categoryIds || [],
      contractStart: initialData?.contractStart || '',
      contractEnd: initialData?.contractEnd || '',
      status: initialData?.status || 'actif',
      subcontractorId: initialData?.subcontractorId || 'none',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden bg-background">

        {/* --- SCROLLABLE BODY --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-primary/20">

          {/* Section: Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> {t('contractorName')}</FormLabel>
                  <FormControl><Input placeholder={t('contractorNamePlaceholder')} {...field} className="h-11 md:h-10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {t('specialty')}</FormLabel>
                  <FormControl><Input placeholder={t('specialtyPlaceholder')} {...field} className="h-11 md:h-10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section: Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4" /> {t('email')}</FormLabel>
                  <FormControl><Input type="email" placeholder="email@example.com" {...field} className="h-11 md:h-10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4" /> {t('phone')}</FormLabel>
                  <FormControl><Input placeholder="0123456789" {...field} className="h-11 md:h-10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section: Projet & Sous-traitant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><FolderKey className="w-4 h-4" /> {t('project')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 md:h-10">
                        <SelectValue placeholder={t('selectProject')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subcontractorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('subcontractor')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 md:h-10">
                        <SelectValue placeholder={t('selectSubcontractor')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('none')}</SelectItem>
                      {subcontractors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                  <FormLabel className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> {t('statusLabel')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 md:h-10">
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="actif">{t('active')}</SelectItem>
                      <SelectItem value="expire">{t('expired')}</SelectItem>
                      <SelectItem value="suspendu">{t('suspended')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section: Catégories Multi-select */}
          <FormField
            control={form.control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('categories')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className="w-full justify-between min-h-11 h-auto py-2">
                        <div className="flex gap-1 flex-wrap">
                          {field.value.length > 0 ? (
                            field.value.map((id) => {
                              const cat = categories.find((c) => c.id === id);
                              return (
                                <Badge key={id} variant="secondary" style={{ color: cat?.color, borderColor: cat?.color }}>
                                  {cat?.name}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-muted-foreground">{t('selectCategories')}</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('searchCategories')} />
                      <CommandList>
                        <CommandEmpty>{t('noCategoryFound')}</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              key={category.id}
                              onSelect={() => {
                                const newValue = field.value.includes(category.id)
                                  ? field.value.filter((id) => id !== category.id)
                                  : [...field.value, category.id];
                                form.setValue("categoryIds", newValue, { shouldValidate: true });
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", field.value.includes(category.id) ? "opacity-100" : "opacity-0")} />
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Section: Dates */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contractStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {t('contractStart')}</FormLabel>
                  <FormControl><Input type="date" {...field} className="h-11 md:h-10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {t('contractEnd')}</FormLabel>
                  <FormControl><Input type="date" {...field} className="h-11 md:h-10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* --- STICKY FOOTER ACTIONS --- */}
        <div className="p-4 bg-background shrink-0 flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 md:h-10">
              {t('cancel')}
            </Button>
          )}
          <Button type="submit" className="flex-1 h-12 md:h-10 font-bold shadow-sm">
            {initialData ? t('save') : (t('addSubcontractor') || 'Ajouter Sous-traitant')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
