import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContractors, useCategories, useSubcontractors, generateId } from "@/hooks/useLocalStorage";
import { Contractor } from "@/types";
import { Plus, Users, Mail, Phone, Calendar, AlertTriangle, Edit, Trash2, Star } from "lucide-react";
import { ContractorForm } from "@/components/ContractorForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";

const Contractors = () => {
  const { t } = useTranslation();
  const [contractors, setContractors] = useContractors();
  const [categories] = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [subcontractors, setSubcontractors] = useSubcontractors();
  const { toast } = useToast();

  // Automatic delay and rating calculation
  useState(() => {
    const today = new Date();
    let updatedSubs = [...subcontractors];
    let hasChanges = false;

    contractors.forEach(contractor => {
      if (contractor.subcontractorId && contractor.status === 'actif') {
        const endDate = new Date(contractor.contractEnd);
        if (today > endDate) {
          const diffTime = today.getTime() - endDate.getTime();
          const delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let penalty = 0;
          if (delayDays > 10) penalty = -3;
          else if (delayDays > 5) penalty = -2;
          else if (delayDays > 0) penalty = -1;

          const subIndex = updatedSubs.findIndex(s => s.id === contractor.subcontractorId);
          if (subIndex !== -1) {
            const currentSub = updatedSubs[subIndex];
            if (currentSub.delay !== delayDays || currentSub.rating !== (5 + penalty)) {
              updatedSubs[subIndex] = {
                ...currentSub,
                delay: delayDays,
                rating: Math.max(0, 5 + penalty) // Base rating 5 - penalty
              };
              hasChanges = true;
            }
          }
        }
      }
    });

    if (hasChanges) {
      setSubcontractors(updatedSubs);
    }
  });

  const handleCreateContractor = (data: Omit<Contractor, 'id' | 'createdAt'>) => {
    const newContractor: Contractor = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setContractors(prev => [...prev, newContractor]);
    setIsDialogOpen(false);
    toast({
      title: t('contractorCreated'),
      description: t('contractorCreatedDesc'),
    });
  };

  const handleUpdateContractor = (data: Omit<Contractor, 'id' | 'createdAt'>) => {
    if (!editingContractor) return;

    setContractors(prev => prev.map(contractor =>
      contractor.id === editingContractor.id
        ? { ...contractor, ...data, subcontractorId: editingContractor.subcontractorId }
        : contractor
    ));
    setEditingContractor(null);
    toast({
      title: t('contractorUpdated'),
      description: t('contractorUpdatedDesc'),
    });
  };

  const handleDeleteContractor = (contractorId: string) => {
    setContractors(prev => prev.filter(c => c.id !== contractorId));
    toast({
      title: t('contractorDeleted'),
      description: t('contractorDeletedDesc'),
    });
  };

  const getCategoryNames = (categoryIds?: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return t('noCategory');
    return categoryIds
      .map(id => categories.find(c => c.id === id)?.name || t('unknownCategory'))
      .join(', ');
  };

  const getStatusColor = (status: Contractor['status']) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'expire': return 'bg-red-100 text-red-800';
      case 'suspendu': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Contractor['status']) => {
    switch (status) {
      case 'actif': return t('active');
      case 'expire': return t('expired');
      case 'suspendu': return t('suspended');
      default: return status;
    }
  };

  const isContractExpired = (contractor: Contractor) => {
    const endDate = new Date(contractor.contractEnd);
    const today = new Date();
    return endDate < today && contractor.status === 'actif';
  };

  const getDaysUntilExpiration = (contractor: Contractor) => {
    const endDate = new Date(contractor.contractEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isContractExpiringSoon = (contractor: Contractor) => {
    const days = getDaysUntilExpiration(contractor);
    return days <= 30 && days > 0 && contractor.status === 'actif';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('contractors')}</h1>
          <p className="text-muted-foreground">{t('manageContractors')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('newContractor')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('newContractor')}</DialogTitle>
            </DialogHeader>
            <ContractorForm onSubmit={handleCreateContractor} />
          </DialogContent>
        </Dialog>
      </div>

      {contractors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noContractors')}</h3>
            <p className="text-muted-foreground mb-4">{t('startAddingContractor')}</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addContractor')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('newContractor')}</DialogTitle>
                </DialogHeader>
                <ContractorForm onSubmit={handleCreateContractor} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contractors.map((contractor) => (
            <Card key={contractor.id} className={`hover:shadow-md transition-shadow ${isContractExpired(contractor) ? 'border-red-200' :
              isContractExpiringSoon(contractor) ? 'border-yellow-200' : ''
              }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{contractor.name}</CardTitle>
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(contractor.status)}>
                      {getStatusLabel(contractor.status)}
                    </Badge>
                    {isContractExpired(contractor) && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t('expired')}
                      </Badge>
                    )}
                    {isContractExpiringSoon(contractor) && (
                      <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {getDaysUntilExpiration(contractor)}j
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="flex items-center justify-between">
                  <span>{contractor.specialty}</span>
                  {contractor.subcontractorId && (
                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Star className="w-3 h-3 fill-primary" />
                      {subcontractors.find(s => s.id === contractor.subcontractorId)?.rating.toFixed(1) || "5.0"}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4" />
                    <span className="truncate">{contractor.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    <span>{contractor.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      {new Date(contractor.contractStart).toLocaleDateString()} - {new Date(contractor.contractEnd).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{t('categories')}: </span>
                    {getCategoryNames(contractor.categoryIds)}
                  </div>

                  {isContractExpired(contractor) && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {t('contractExpiredSince', { days: Math.abs(getDaysUntilExpiration(contractor)) })}
                      </div>
                    </div>
                  )}

                  {isContractExpiringSoon(contractor) && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {t('contractExpiresIn', { days: getDaysUntilExpiration(contractor) })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setEditingContractor(contractor)}>
                          <Edit className="h-4 w-4 mr-1" />
                          {t('edit')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('editContractor')}</DialogTitle>
                        </DialogHeader>
                        <ContractorForm
                          onSubmit={handleUpdateContractor}
                          initialData={{
                            name: contractor.name,
                            email: contractor.email,
                            phone: contractor.phone,
                            specialty: contractor.specialty,
                            projectId: contractor.projectId,
                            categoryIds: contractor.categoryIds,
                            contractStart: contractor.contractStart,
                            contractEnd: contractor.contractEnd,
                            status: contractor.status,
                            subcontractorId: contractor.subcontractorId
                          }}
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteContractorWarning', { name: contractor.name })}
                            <br />
                            {t('irreversibleAction')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteContractor(contractor.id)}>
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {t('addedOn')} {new Date(contractor.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Contractors;