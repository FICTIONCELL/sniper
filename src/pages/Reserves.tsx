import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReserves, useProjects, useBlocks, useApartments, useCategories, useContractors, generateId } from "@/hooks/useLocalStorage";
import { Reserve } from "@/types";
import { Plus, AlertTriangle, Eye, Filter } from "lucide-react";
import { ReserveForm } from "@/components/ReserveForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/contexts/TranslationContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useGoogleDrive } from "@/contexts/GoogleDriveContext";

// ... inside component ...
const Reserves = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { canAddReserve, isTrial, limits, isActive } = useSubscription();
  const { uploadReservePhoto, isAuthenticated } = useGoogleDrive();
  const [reserves, setReserves] = useReserves();
  const [projects] = useProjects();
  const [categories] = useCategories();
  const [contractors] = useContractors();
  const [blocks] = useBlocks();
  const [apartments] = useApartments();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterContractor, setFilterContractor] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const getFilteredProjects = () => {
    return projects;
  };

  const getFilteredCategories = () => {
    return categories;
  };

  const getFilteredContractors = () => {
    return contractors;
  };

  const canAdd = canAddReserve(reserves.length);

  const handleCreateReserve = async (data: Omit<Reserve, 'id' | 'createdAt'>, files?: File[]) => {
    const newReserve: Reserve = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    // If we have files and are authenticated, upload them
    if (files && files.length > 0 && isAuthenticated) {
      const uploadedImages: string[] = [];

      // Keep existing base64 images if any (from offline or non-file sources)
      // But ideally we replace them with Drive links.
      // For now, let's append Drive links or replace if we can match them.
      // Since we don't have easy matching, we'll just upload and add the links.
      // Note: The 'data.images' currently contains base64 previews. 
      // We might want to clear it if we successfully upload everything, OR keep it for offline fallback?
      // For this refactor, let's try to upload and use the links.

      toast({
        title: "Upload en cours",
        description: `Sauvegarde de ${files.length} photo(s) sur Drive...`,
      });

      for (const file of files) {
        try {
          const uploadedFile = await uploadReservePhoto(file, newReserve.projectId, newReserve.id);
          if (uploadedFile) {
            // Use thumbnailLink or webViewLink. 
            // thumbnailLink is good for previews. webViewLink for full view.
            // Let's store the thumbnailLink for display.
            if (uploadedFile.thumbnailLink) {
              uploadedImages.push(uploadedFile.thumbnailLink);
            }
          }
        } catch (error) {
          console.error("Failed to upload file", error);
        }
      }

      if (uploadedImages.length > 0) {
        // Replace base64 with Drive links (or append? replacing is cleaner for storage)
        // If we assume all images in 'data.images' came from these files, we can replace.
        newReserve.images = uploadedImages;
      }
    }

    setReserves(prev => [...prev, newReserve]);
    setIsDialogOpen(false);
  };

  const filteredReserves = reserves.filter(reserve => {
    if (filterStatus !== "all" && reserve.status !== filterStatus) return false;
    if (filterPriority !== "all" && reserve.priority !== filterPriority) return false;
    if (filterProject !== "all" && reserve.projectId !== filterProject) return false;
    if (filterCategory !== "all" && reserve.categoryId !== filterCategory) return false;
    if (filterContractor !== "all" && reserve.contractorId !== filterContractor) return false;
    return true;
  });

  const getStatusColor = (status: Reserve['status']) => {
    switch (status) {
      case 'ouverte': return 'bg-red-100 text-red-800';
      case 'en_cours': return 'bg-yellow-100 text-yellow-800';
      case 'resolue': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generatePVContent = (reserve: Reserve, date: string, delayDays: number, reservesList: string[]) => {
    const hasReserves = reservesList.length > 0;
    const isOnTime = delayDays <= 0;

    let content = `${t('pvIntro')} ${date}, ${t('pvVerification')}\n`;

    if (!hasReserves && isOnTime) {
      content += `${t('pvConform')}\n${t('pvNoReserves')}`;
    } else if (!hasReserves && !isOnTime) {
      content += `${t('pvConform')}\n${t('pvDelay')} ${t('pvDelayCount', { days: Math.abs(delayDays) })}\n${t('pvPenalties')}`;
    } else if (hasReserves && isOnTime) {
      content += `${t('pvObservation')}\n${t('pvReservesIssued')} ${reservesList.join(', ')}.\n${t('pvReserveCommitment')}`;
    } else {
      content += `${t('pvObservation')}\n${t('pvReservesIssued')} ${reservesList.join(', ')}.\n${t('pvDelay')} ${t('pvDelayCount', { days: Math.abs(delayDays) })}\n${t('pvPenalties')}`;
    }
    return content;
  };

  const getPriorityColor = (priority: Reserve['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'faible': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Reserve['status']) => {
    switch (status) {
      case 'ouverte': return t('openReserves'); // Or specific status key
      case 'en_cours': return t('inProgress');
      case 'resolue': return t('completed'); // Or 'resolved' if I add it
      default: return status;
    }
  };

  const getPriorityLabel = (priority: Reserve['priority']) => {
    switch (priority) {
      case 'urgent': return t('urgent');
      case 'normal': return t('normal');
      case 'faible': return t('low');
      default: return priority;
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || t('unknownProject');
  };

  const getBlockName = (blockId?: string) => {
    if (!blockId) return null;
    return blocks.find(b => b.id === blockId)?.name || t('unknownBlock');
  };

  const getApartmentNumber = (apartmentId?: string) => {
    if (!apartmentId) return null;
    return apartments.find(a => a.id === apartmentId)?.number || t('unknownApartment');
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || t('unknownCategory');
  };

  const getContractorName = (contractorId: string) => {
    return contractors.find(c => c.id === contractorId)?.name || t('unknownContractor');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('reserves')}</h1>
          <p className="text-muted-foreground text-sm md:text-base">{t('manageReserves')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} disabled={!isActive || !canAdd} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              {t('newReserve')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('createReserve')}</DialogTitle>
            </DialogHeader>
            <ReserveForm onSubmit={handleCreateReserve} />
          </DialogContent>
        </Dialog>
      </div>

      {isTrial && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            {t('trialLimitInfo') || `Mode essai: ${reserves.length}/${limits.maxReserves} réserve(s) utilisée(s)`}
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex gap-3 items-center min-w-max">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">{t('filters')}:</span>
          </div>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[140px] md:w-48">
              <SelectValue placeholder={t('project')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allProjects')}</SelectItem>
              {getFilteredProjects().map(project => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] md:w-48">
              <SelectValue placeholder={t('category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allCategories')}</SelectItem>
              {getFilteredCategories().map(category => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterContractor} onValueChange={setFilterContractor}>
            <SelectTrigger className="w-[140px] md:w-48">
              <SelectValue placeholder={t('contractor')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allContractors')}</SelectItem>
              {getFilteredContractors().map(contractor => (
                <SelectItem key={contractor.id} value={contractor.id}>{contractor.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] md:w-48">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="ouverte">{t('openReserves')}</SelectItem>
              <SelectItem value="en_cours">{t('inProgress')}</SelectItem>
              <SelectItem value="resolue">{t('completed')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] md:w-48">
              <SelectValue placeholder={t('priority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allPriorities')}</SelectItem>
              <SelectItem value="urgent">{t('urgent')}</SelectItem>
              <SelectItem value="normal">{t('normal')}</SelectItem>
              <SelectItem value="faible">{t('low')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredReserves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noReserves')}</h3>
            <p className="text-muted-foreground mb-4">
              {reserves.length === 0 ? t('startCreatingReserve') : t('noReservesFound')}
            </p>
            {reserves.length === 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createReserve')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('createReserve')}</DialogTitle>
                  </DialogHeader>
                  <ReserveForm onSubmit={handleCreateReserve} />
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReserves.map((reserve) => (
            <Card key={reserve.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 overflow-hidden">
                    <CardTitle className="text-lg truncate">{reserve.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {reserve.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(reserve.status)}`}>
                      {getStatusLabel(reserve.status)}
                    </Badge>
                    <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor(reserve.priority)}`}>
                      {getPriorityLabel(reserve.priority)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <p className="font-medium text-muted-foreground">{t('project')}:</p>
                      <p className="truncate">{getProjectName(reserve.projectId)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">{t('category')}:</p>
                      <p className="truncate">{getCategoryName(reserve.categoryId)}</p>
                    </div>
                    {getBlockName(reserve.blockId) && (
                      <div>
                        <p className="font-medium text-muted-foreground">{t('block')}:</p>
                        <p className="truncate">{getBlockName(reserve.blockId)}</p>
                      </div>
                    )}
                    {getApartmentNumber(reserve.apartmentId) && (
                      <div>
                        <p className="font-medium text-muted-foreground">{t('apartment')}:</p>
                        <p className="truncate">{getApartmentNumber(reserve.apartmentId)}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="font-medium text-muted-foreground">{t('contractor')}:</p>
                      <p className="truncate">{getContractorName(reserve.contractorId)}</p>
                    </div>
                  </div>

                  {reserve.images && reserve.images.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Plus className="h-3 w-3" />
                      <span>{t('attachedImages', { count: reserve.images.length })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground italic">
                      {new Date(reserve.createdAt).toLocaleDateString()}
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <Eye className="mr-2 h-3 w-3" />
                          {t('viewDetails')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        {reserve && (
                          <>
                            <DialogHeader>
                              <DialogTitle>{reserve.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">{t('project')}</p>
                                  <p>{getProjectName(reserve.projectId)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{t('status')}</p>
                                  <Badge className={getStatusColor(reserve.status)}>
                                    {getStatusLabel(reserve.status)}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{t('priority')}</p>
                                  <Badge className={getPriorityColor(reserve.priority)}>
                                    {getPriorityLabel(reserve.priority)}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{t('category')}</p>
                                  <p>{getCategoryName(reserve.categoryId)}</p>
                                </div>
                                {getBlockName(reserve.blockId) && (
                                  <div>
                                    <p className="text-sm font-medium">{t('block')}</p>
                                    <p>{getBlockName(reserve.blockId)}</p>
                                  </div>
                                )}
                                {getApartmentNumber(reserve.apartmentId) && (
                                  <div>
                                    <p className="text-sm font-medium">{t('apartment')}</p>
                                    <p>{getApartmentNumber(reserve.apartmentId)}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium">{t('contractor')}</p>
                                  <p>{getContractorName(reserve.contractorId)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{t('createdOn')}</p>
                                  <p>{new Date(reserve.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{t('description')}</p>
                                <p className="text-muted-foreground">{reserve.description}</p>
                              </div>
                              {reserve.images && reserve.images.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium">{t('images')}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {reserve.images.map((image, index) => (
                                      <img key={index} src={image} alt={`Image ${index}`} className="w-20 h-20 object-cover rounded border" />
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">{t('receptionReport')}</p>
                                <div className="border rounded p-4 mt-2 bg-white text-black">
                                  <p className="text-sm whitespace-pre-line">
                                    {generatePVContent(
                                      reserve,
                                      new Date(reserve.createdAt).toLocaleDateString(),
                                      0, // Remplacer par la logique de calcul des jours de retard
                                      reserve.description.split(', ') // Remplacer par la logique de récupération des réserves
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
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

export default Reserves;