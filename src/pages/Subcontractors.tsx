import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSubcontractors, useCategories, useContractors, generateId } from "@/hooks/useLocalStorage";
import { Subcontractor, Contractor } from "@/types";
import { Plus, Search, Filter, Star, Clock, DollarSign, Phone, Mail, MapPin, Trash2, Edit, Eye, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const subcontractorSchema = z.object({
    name: z.string().min(2, "Le nom est requis"),
    domain: z.string().min(1, "Le domaine est requis"),
    status: z.enum(["entreprise", "artisan"]),
    phone: z.string().min(8, "Téléphone invalide"),
    email: z.string().email("Email invalide"),
    zone: z.string().min(2, "La zone est requise"),
    typePrestation: z.enum(["fourniture_pose", "pose", "fourniture"]),
    price: z.number().positive("Le prix doit être positif"),
    unit: z.enum(["m2", "ml", "forfait"]),
    tvaIncluded: z.boolean().default(false),
});

const Subcontractors = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [subcontractors, setSubcontractors] = useSubcontractors();
    const [contractors, setContractors] = useContractors();
    const [categories] = useCategories();

    const [searchTerm, setSearchTerm] = useState("");
    const [domainFilter, setDomainFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);

    const form = useForm<z.infer<typeof subcontractorSchema>>({
        resolver: zodResolver(subcontractorSchema),
        defaultValues: {
            name: "",
            domain: "",
            status: "entreprise",
            phone: "",
            email: "",
            zone: "",
            typePrestation: "fourniture_pose",
            price: 0,
            unit: "m2",
            tvaIncluded: false,
        },
    });

    const filteredSubcontractors = useMemo(() => {
        return subcontractors.filter((s) => {
            const matchesSearch =
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.domain.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDomain = domainFilter === "all" || s.domain === domainFilter;
            const matchesType = typeFilter === "all" || s.typePrestation === typeFilter;
            const matchesRating = s.rating >= ratingFilter;

            return matchesSearch && matchesDomain && matchesType && matchesRating;
        });
    }, [subcontractors, searchTerm, domainFilter, typeFilter, ratingFilter]);

    const generateCode = (domain: string) => {
        const prefix = domain.substring(0, 3).toUpperCase();
        const count = subcontractors.filter(s => s.domain === domain).length + 1;
        return `ST-${prefix}-${count.toString().padStart(3, '0')}`;
    };

    const onSubmit = (values: z.infer<typeof subcontractorSchema>) => {
        if (editingSubcontractor) {
            const updated = subcontractors.map(s =>
                s.id === editingSubcontractor.id ? {
                    ...s,
                    name: values.name,
                    domain: values.domain,
                    status: values.status,
                    phone: values.phone,
                    email: values.email,
                    zone: values.zone,
                    typePrestation: values.typePrestation,
                    price: values.price,
                    unit: values.unit,
                    tvaIncluded: values.tvaIncluded,
                } : s
            );
            setSubcontractors(updated);
            toast({ title: t('subcontractorUpdated') });
        } else {
            const newSub: Subcontractor = {
                id: generateId(),
                code: generateCode(values.domain),
                name: values.name,
                domain: values.domain,
                status: values.status,
                phone: values.phone,
                email: values.email,
                zone: values.zone,
                typePrestation: values.typePrestation,
                price: values.price,
                unit: values.unit,
                tvaIncluded: values.tvaIncluded,
                delay: 0,
                rating: 0,
                createdAt: new Date().toISOString(),
            };
            setSubcontractors([...subcontractors, newSub]);
            toast({ title: t('subcontractorCreated') });
        }
        setIsDialogOpen(false);
        setEditingSubcontractor(null);
        form.reset();
    };

    const handleDelete = (id: string) => {
        setSubcontractors(subcontractors.filter(s => s.id !== id));
        toast({ title: t('subcontractorDeleted') });
    };

    const handleEdit = (sub: Subcontractor) => {
        setEditingSubcontractor(sub);
        form.reset({
            name: sub.name,
            domain: sub.domain,
            status: sub.status,
            phone: sub.phone,
            email: sub.email,
            zone: sub.zone,
            typePrestation: sub.typePrestation,
            price: sub.price,
            unit: sub.unit,
            tvaIncluded: sub.tvaIncluded,
        });
        setIsDialogOpen(true);
    };

    const handleAddToContractors = (sub: Subcontractor) => {
        // Check if already added
        const exists = contractors.some(c => c.subcontractorId === sub.id);
        if (exists) {
            toast({
                title: t('alreadyAdded'),
                variant: "destructive"
            });
            return;
        }

        const newContractor: Contractor = {
            id: generateId(),
            name: sub.name,
            email: sub.email,
            phone: sub.phone,
            specialty: sub.domain,
            projectId: "", // User will need to assign this in Contractors page
            categoryIds: [], // User will need to assign this in Contractors page
            contractStart: new Date().toISOString().split('T')[0],
            contractEnd: new Date().toISOString().split('T')[0],
            status: 'actif',
            subcontractorId: sub.id,
            createdAt: new Date().toISOString(),
        };

        setContractors([...contractors, newContractor]);
        toast({
            title: t('addedToContractors'),
            description: t('addedToContractorsDesc'),
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t('subcontractorComparison')}</h1>
                    <p className="text-muted-foreground">{t('manageContractors')}</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingSubcontractor(null);
                        form.reset();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg transition-all hover:scale-105">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('addSubcontractor')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingSubcontractor ? t('editContractor') : t('addSubcontractor')}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-primary border-b pb-1">{t('generalInfo')}</h3>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('contractorName')}</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="domain"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('domain')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('domain')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categories.map(cat => (
                                                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                                            ))}
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="entreprise">{t('enterprise')}</SelectItem>
                                                            <SelectItem value="artisan">{t('artisan')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('phone')}</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('email')}</FormLabel>
                                                    <FormControl><Input {...field} type="email" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="zone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('zone')}</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-sm text-primary border-b pb-1">{t('pricingInfo')}</h3>
                                        <FormField
                                            control={form.control}
                                            name="typePrestation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('typePrestation')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="fourniture_pose">{t('fourniture_pose')}</SelectItem>
                                                            <SelectItem value="pose">{t('pose')}</SelectItem>
                                                            <SelectItem value="fourniture">{t('fourniture')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('price')}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="unit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('unit')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="m2">{t('m2')}</SelectItem>
                                                            <SelectItem value="ml">{t('ml')}</SelectItem>
                                                            <SelectItem value="forfait">{t('forfait')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="tvaIncluded"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>{t('tvaIncluded')}</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <input
                                                            type="checkbox"
                                                            checked={field.value}
                                                            onChange={field.onChange}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                                    <Button type="submit">{t('save')}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('searchPlaceholder')}
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={domainFilter} onValueChange={setDomainFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder={t('domain')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allDomains')}</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('typePrestation')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allTypes')}</SelectItem>
                                <SelectItem value="fourniture_pose">{t('fourniture_pose')}</SelectItem>
                                <SelectItem value="pose">{t('pose')}</SelectItem>
                                <SelectItem value="fourniture">{t('fourniture')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{t('minRating')}:</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 cursor-pointer ${ratingFilter >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                        onClick={() => setRatingFilter(ratingFilter === star ? 0 : star)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('code')}</TableHead>
                                    <TableHead>{t('domain')}</TableHead>
                                    <TableHead>{t('typePrestation')}</TableHead>
                                    <TableHead>{t('price')}</TableHead>
                                    <TableHead>{t('unit')}</TableHead>
                                    <TableHead>{t('delay')}</TableHead>
                                    <TableHead>{t('rating')}</TableHead>
                                    <TableHead>{t('statusLabel')}</TableHead>
                                    <TableHead>{t('phone')}</TableHead>
                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubcontractors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">
                                            {t('noSubcontractors')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSubcontractors.map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-medium">{sub.code}</TableCell>
                                            <TableCell>{sub.domain}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {t(sub.typePrestation)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {sub.price} {sub.tvaIncluded ? "(TTC)" : "(HT)"}
                                            </TableCell>
                                            <TableCell>{t(sub.unit)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Clock className={`h-3 w-3 ${sub.delay > 0 ? "text-red-500" : "text-green-500"}`} />
                                                    <span className={sub.delay > 0 ? "text-red-500 font-medium" : "text-green-500"}>
                                                        {sub.delay}j
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-0.5">
                                                    {sub.rating > 0 ? (
                                                        <>
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-sm font-medium">{sub.rating.toFixed(1)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={sub.status === 'entreprise' ? 'default' : 'secondary'}>
                                                    {t(sub.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{sub.phone}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleAddToContractors(sub)} title={t('addToContractors')}>
                                                        <UserPlus className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    {t('irreversibleAction')}
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(sub.id)} className="bg-red-500 hover:bg-red-600">
                                                                    {t('delete')}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Subcontractors;
