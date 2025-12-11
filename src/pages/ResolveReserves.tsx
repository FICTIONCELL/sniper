import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useReserves, useProjects, useBlocks, useApartments, useCategories, useContractors } from "@/hooks/useLocalStorage";
import { Reserve } from "@/types";
import { CheckCircle, X, AlertTriangle, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

const ResolveReserves = () => {
  const [reserves, setReserves] = useReserves();
  const [projects] = useProjects();
  const [blocks] = useBlocks();
  const [apartments] = useApartments();
  const [categories] = useCategories();
  const [contractors] = useContractors();
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  const openReserves = reserves.filter(r => r.status === 'ouverte' || r.status === 'en_cours');

  const handleResolveReserve = () => {
    if (!selectedReserve) return;

    setReserves(prev => prev.map(reserve => 
      reserve.id === selectedReserve.id 
        ? { 
            ...reserve, 
            status: 'resolue' as Reserve['status'],
            resolvedAt: new Date().toISOString()
          }
        : reserve
    ));

    toast({
      title: "Réserve résolue",
      description: `La réserve "${selectedReserve.title}" a été marquée comme résolue.`,
    });

    setIsResolveDialogOpen(false);
    setSelectedReserve(null);
    setResolutionNotes("");
  };

  const getStatusColor = (status: Reserve['status']) => {
    switch (status) {
      case 'ouverte': return 'bg-red-100 text-red-800';
      case 'en_cours': return 'bg-yellow-100 text-yellow-800';
      case 'resolue': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      case 'ouverte': return 'Ouverte';
      case 'en_cours': return 'En cours';
      case 'resolue': return 'Résolue';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: Reserve['priority']) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'normal': return 'Normal';
      case 'faible': return 'Faible';
      default: return priority;
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Projet inconnu';
  };

  const getBlockName = (blockId?: string) => {
    if (!blockId) return null;
    return blocks.find(b => b.id === blockId)?.name || 'Bloc inconnu';
  };

  const getApartmentNumber = (apartmentId?: string) => {
    if (!apartmentId) return null;
    return apartments.find(a => a.id === apartmentId)?.number || 'Appartement inconnu';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Catégorie inconnue';
  };

  const getContractorName = (contractorId: string) => {
    return contractors.find(c => c.id === contractorId)?.name || 'Sous-traitant inconnu';
  };

  const getDaysSinceCreation = (createdAt: string) => {
    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = today.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Levée de Réserves</h1>
        <p className="text-muted-foreground">Résolvez et fermez les réserves ouvertes</p>
      </div>

      {openReserves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune réserve ouverte</h3>
            <p className="text-muted-foreground">Toutes les réserves ont été résolues !</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">{openReserves.length} réserve(s) en attente</span>
            </div>
            <Badge variant="outline" className="text-red-600 border-red-200">
              {openReserves.filter(r => r.priority === 'urgent').length} urgente(s)
            </Badge>
          </div>

          <div className="grid gap-4">
            {openReserves
              .sort((a, b) => {
                // Trier par priorité puis par date de création
                const priorityOrder = { urgent: 0, normal: 1, faible: 2 };
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              })
              .map((reserve) => (
                <Card key={reserve.id} className={`hover:shadow-md transition-shadow ${
                  reserve.priority === 'urgent' ? 'border-red-200 bg-red-50/30' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{reserve.title}</CardTitle>
                          {reserve.priority === 'urgent' && (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {reserve.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={getStatusColor(reserve.status)}>
                          {getStatusLabel(reserve.status)}
                        </Badge>
                        <Badge className={getPriorityColor(reserve.priority)}>
                          {getPriorityLabel(reserve.priority)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Projet</p>
                          <p>{getProjectName(reserve.projectId)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Catégorie</p>
                          <p>{getCategoryName(reserve.categoryId)}</p>
                        </div>
                        {getBlockName(reserve.blockId) && (
                          <div>
                            <p className="font-medium text-muted-foreground">Bloc</p>
                            <p>{getBlockName(reserve.blockId)}</p>
                          </div>
                        )}
                        {getApartmentNumber(reserve.apartmentId) && (
                          <div>
                            <p className="font-medium text-muted-foreground">Appartement</p>
                            <p>{getApartmentNumber(reserve.apartmentId)}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Sous-traitant</p>
                          <p>{getContractorName(reserve.contractorId)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Il y a {getDaysSinceCreation(reserve.createdAt)} jour(s)
                          </span>
                        </div>
                      </div>

                      {reserve.images.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {reserve.images.length} image(s) attachée(s)
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReserves(prev => prev.map(r => 
                              r.id === reserve.id ? { ...r, status: 'en_cours' as Reserve['status'] } : r
                            ));
                            toast({
                              title: "Réserve mise à jour",
                              description: "La réserve a été marquée comme en cours.",
                            });
                          }}
                          disabled={reserve.status === 'en_cours'}
                        >
                          Prendre en charge
                        </Button>
                        <Dialog 
                          open={isResolveDialogOpen && selectedReserve?.id === reserve.id} 
                          onOpenChange={(open) => {
                            setIsResolveDialogOpen(open);
                            if (open) {
                              setSelectedReserve(reserve);
                            } else {
                              setSelectedReserve(null);
                              setResolutionNotes("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Résoudre
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Résoudre la réserve</DialogTitle>
                              <DialogDescription>
                                Êtes-vous sûr de vouloir marquer cette réserve comme résolue ?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 border rounded bg-muted/50">
                                <h4 className="font-medium">{reserve.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{reserve.description}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Notes de résolution (optionnel)</label>
                                <Textarea
                                  placeholder="Décrivez comment la réserve a été résolue..."
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsResolveDialogOpen(false)}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Annuler
                                </Button>
                                <Button 
                                  onClick={handleResolveReserve}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirmer la résolution
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolveReserves;