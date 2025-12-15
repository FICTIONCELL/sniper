import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReserves, useProjects, useBlocks, useApartments, useCategories, useContractors, generateId } from "@/hooks/useLocalStorage";
import { Reserve } from "@/types";
import { Plus, Search, Filter, Eye, Calendar, MapPin, User, Tag } from "lucide-react";
import { CompactReserveForm } from "@/components/CompactReserveForm";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";

const CompactReserves = () => {
  const [reserves, setReserves] = useReserves();
  const [projects] = useProjects();
  const [blocks] = useBlocks();
  const [apartments] = useApartments();
  const [categories] = useCategories();
  const [contractors] = useContractors();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [selectedReserve, setSelectedReserve] = useState<Reserve | null>(null);

  const handleCreateReserve = (data: Omit<Reserve, 'id' | 'createdAt'>) => {
    const newReserve: Reserve = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setReserves(prev => [...prev, newReserve]);
    setIsFormOpen(false);
  };

  const filteredReserves = useMemo(() => {
    return reserves.filter(reserve => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const projectName = getProjectName(reserve.projectId).toLowerCase();
        const blockName = getBlockName(reserve.blockId)?.toLowerCase() || "";
        const apartmentNumber = getApartmentNumber(reserve.apartmentId)?.toLowerCase() || "";
        const categoryName = getCategoryName(reserve.categoryId).toLowerCase();
        
        const searchMatch = 
          reserve.title.toLowerCase().includes(query) ||
          reserve.description.toLowerCase().includes(query) ||
          projectName.includes(query) ||
          blockName.includes(query) ||
          apartmentNumber.includes(query) ||
          categoryName.includes(query);
        
        if (!searchMatch) return false;
      }
      
      // Project filter
      if (filterProject !== "all" && reserve.projectId !== filterProject) return false;
      
      // Status filter
      if (filterStatus !== "all" && reserve.status !== filterStatus) return false;
      
      // Priority filter
      if (filterPriority !== "all" && reserve.priority !== filterPriority) return false;
      
      return true;
    });
  }, [reserves, searchQuery, filterProject, filterStatus, filterPriority]);

  const getStatusColor = (status: Reserve['status']) => {
    switch (status) {
      case 'ouverte': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'en_cours': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'resolue': return 'bg-green-500/10 text-green-700 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: Reserve['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'faible': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: Reserve['status']) => {
    switch (status) {
      case 'ouverte': return 'Ouvert';
      case 'en_cours': return 'En cours';
      case 'resolue': return 'Terminé';
      default: return status;
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

  const generatePVNumber = (reserve: Reserve) => {
    const date = new Date(reserve.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const index = reserves.findIndex(r => r.id === reserve.id) + 1;
    return `PV-${year}-${month}-${String(index).padStart(3, '0')}`;
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mode Compact - Réserves</h1>
            <p className="text-muted-foreground">Gestion rapide des réserves</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher projets, blocs, appartements, catégories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous projets</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="ouverte">Ouvert</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="resolue">Terminé</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="faible">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reserves Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredReserves.map((reserve) => (
          <button
            key={reserve.id}
            className="hover:shadow-md transition-shadow cursor-pointer border-none bg-transparent p-0"
            onClick={() => setSelectedReserve(reserve)}
          >
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {reserve.title}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Badge className={getStatusColor(reserve.status)} variant="outline">
                        {getStatusLabel(reserve.status)}
                      </Badge>
                      <Badge className={getPriorityColor(reserve.priority)} variant="outline">
                        {reserve.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Project and Location */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">{getProjectName(reserve.projectId)}</span>
                  </div>

                  {getBlockName(reserve.blockId) && (
                    <div className="flex items-center gap-2 text-muted-foreground ml-5">
                      <span>🏘 {getBlockName(reserve.blockId)}</span>
                    </div>
                  )}

                  {getApartmentNumber(reserve.apartmentId) && (
                    <div className="flex items-center gap-2 text-muted-foreground ml-5">
                      <span>🏢 Appt {getApartmentNumber(reserve.apartmentId)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    <span>{getCategoryName(reserve.categoryId)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{getContractorName(reserve.contractorId)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(reserve.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Description preview */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {reserve.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setSelectedReserve(reserve); }}>
                    <Eye className="mr-1 h-3 w-3" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setSelectedQR(reserve.id); }}
                  >
                    QR
                  </Button>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}

        {filteredReserves.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune réserve trouvée</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  {reserves.length === 0 
                    ? "Commencez par créer votre première réserve" 
                    : "Modifiez les filtres de recherche ou créez une nouvelle réserve"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        size="lg"
        onClick={() => setIsFormOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Compact Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <CompactReserveForm
            onSubmit={handleCreateReserve}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Reserve Details Dialog */}
      <Dialog open={!!selectedReserve} onOpenChange={() => setSelectedReserve(null)}>
        <DialogContent className="max-w-2xl">
          {selectedReserve && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedReserve.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Projet</p>
                    <p>{getProjectName(selectedReserve.projectId)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Statut</p>
                    <Badge className={getStatusColor(selectedReserve.status)}>
                      {getStatusLabel(selectedReserve.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priorité</p>
                    <Badge className={getPriorityColor(selectedReserve.priority)}>
                      {selectedReserve.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Catégorie</p>
                    <p>{getCategoryName(selectedReserve.categoryId)}</p>
                  </div>
                  {getBlockName(selectedReserve.blockId) && (
                    <div>
                      <p className="text-sm font-medium">Bloc</p>
                      <p>{getBlockName(selectedReserve.blockId)}</p>
                    </div>
                  )}
                  {getApartmentNumber(selectedReserve.apartmentId) && (
                    <div>
                      <p className="text-sm font-medium">Appartement</p>
                      <p>{getApartmentNumber(selectedReserve.apartmentId)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Sous-traitant</p>
                    <p>{getContractorName(selectedReserve.contractorId)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date de création</p>
                    <p>{new Date(selectedReserve.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-muted-foreground">{selectedReserve.description}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="max-w-md">
          {selectedQR && (() => {
            const reserve = reserves.find(r => r.id === selectedQR);
            if (!reserve) return null;

            return (
              <QRCodeGenerator
                data={{
                  pvNumber: generatePVNumber(reserve),
                  date: new Date(reserve.createdAt).toLocaleDateString(),
                  id: reserve.id,
                  type: 'reserve',
                  title: reserve.title
                }}
                size={200}
              />
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompactReserves;