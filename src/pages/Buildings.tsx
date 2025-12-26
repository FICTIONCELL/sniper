import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProjects, useBlocks, useApartments, generateId } from "@/hooks/useLocalStorage";
import { BlockForm } from "@/components/BlockForm";
import { ApartmentForm } from "@/components/ApartmentForm";
import { useTranslation } from "@/contexts/TranslationContext";
import { Block, Apartment } from "@/types";

const Buildings = () => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [projects] = useProjects();
  const [blocks, setBlocks] = useBlocks();
  const [apartments, setApartments] = useApartments();

  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isApartmentDialogOpen, setIsApartmentDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");

  const handleCreateBlock = (data: Omit<Block, 'id' | 'projectId' | 'createdAt'> & { apartmentCount?: number }) => {
    if (!selectedProjectId) {
      toast({
        title: t('selectProject'),
        description: t('selectProjectDescription'),
        variant: "destructive"
      });
      return;
    }

    const { apartmentCount, ...blockData } = data;
    const blockId = generateId();
    const newBlock: Block = {
      ...blockData,
      id: blockId,
      projectId: selectedProjectId,
      createdAt: new Date().toISOString()
    };

    setBlocks(prev => [...prev, newBlock]);

    // Generate apartments if requested
    if (apartmentCount && apartmentCount > 0) {
      const newApartments: Apartment[] = [];
      for (let i = 1; i <= apartmentCount; i++) {
        newApartments.push({
          id: generateId(),
          blockId: blockId,
          projectId: selectedProjectId,
          number: `${blockData.name}-${i.toString().padStart(2, '0')}`,
          type: 'appartement',
          surface: 0,
          status: 'libre',
          createdAt: new Date().toISOString()
        });
      }
      setApartments(prev => [...prev, ...newApartments]);
    }

    setIsBlockDialogOpen(false);
    toast({
      title: t('blockCreated'),
      description: apartmentCount
        ? t('blockAndApartmentsCreated', { count: apartmentCount })
        : t('blockCreatedDescription'),
    });
  };

  const handleEditBlock = (data: Omit<Block, 'id' | 'projectId' | 'createdAt'>) => {
    if (!editingBlock) return;

    const updatedBlock = { ...editingBlock, ...data };
    setBlocks(prev => prev.map(block => block.id === editingBlock.id ? updatedBlock : block));
    setEditingBlock(null);
    setIsBlockDialogOpen(false);
    toast({
      title: t('blockUpdated'),
      description: t('blockUpdatedDescription'),
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    // Also delete apartments in this block
    setApartments(prev => prev.filter(apt => apt.blockId !== blockId));
    toast({
      title: t('blockDeleted'),
      description: t('blockDeletedDescription'),
    });
  };

  const handleCreateApartment = (data: Omit<Apartment, 'id' | 'blockId' | 'createdAt'>) => {
    if (!selectedBlockId) {
      toast({
        title: t('selectBlock'),
        description: t('selectBlockDescription'),
        variant: "destructive"
      });
      return;
    }

    const newApartment: Apartment = {
      ...data,
      id: generateId(),
      blockId: selectedBlockId,
      createdAt: new Date().toISOString()
    };

    setApartments(prev => [...prev, newApartment]);
    setIsApartmentDialogOpen(false);
    toast({
      title: t('apartmentCreated'),
      description: t('apartmentCreatedDescription'),
    });
  };

  const handleEditApartment = (data: Omit<Apartment, 'id' | 'blockId' | 'createdAt'>) => {
    if (!editingApartment) return;

    const updatedApartment = { ...editingApartment, ...data };
    setApartments(prev => prev.map(apt => apt.id === editingApartment.id ? updatedApartment : apt));
    setEditingApartment(null);
    setIsApartmentDialogOpen(false);
    toast({
      title: t('apartmentUpdated'),
      description: t('apartmentUpdatedDescription'),
    });
  };

  const handleDeleteApartment = (apartmentId: string) => {
    setApartments(prev => prev.filter(apt => apt.id !== apartmentId));
    toast({
      title: t('apartmentDeleted'),
      description: t('apartmentDeletedDescription'),
    });
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : t('unknownProject');
  };

  const getBlockName = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    return block ? block.name : t('unknownBlock');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'occupé': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'réservé': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 md:h-8 md:w-8" />
            {t('buildingsAndApartments')}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t('manageBuildingsDescription')}
          </p>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{t('selectProject')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {projects.map(project => (
              <Button
                key={project.id}
                variant={selectedProjectId === project.id ? "default" : "outline"}
                onClick={() => setSelectedProjectId(project.id)}
                size="sm"
                className="flex-1 sm:flex-none min-w-[100px]"
              >
                {project.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {t('blocks')}
          </h2>
          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('addBlock')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBlock ? t('editBlock') : t('createBlock')}
                </DialogTitle>
              </DialogHeader>
              <BlockForm
                onSubmit={editingBlock ? handleEditBlock : handleCreateBlock}
                initialData={editingBlock || undefined}
                isEditing={!!editingBlock}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks
            .filter(block => !selectedProjectId || block.projectId === selectedProjectId)
            .map(block => (
              <Card key={block.id} className="border-l-4 border-l-primary overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg truncate">{block.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingBlock(block);
                          setIsBlockDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground mb-1 truncate">
                    {t('project')}: {getProjectName(block.projectId)}
                  </p>
                  {block.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {block.description}
                    </p>
                  )}
                  <p className="text-sm font-medium">
                    {t('apartments')}: {apartments.filter(apt => apt.blockId === block.id).length}
                  </p>
                </CardContent>
              </Card>
            ))
          }
        </div>
      </div>

      {/* Block Selection for Apartments */}
      {selectedProjectId && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">{t('selectBlock')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {blocks
                .filter(block => block.projectId === selectedProjectId)
                .map(block => (
                  <Button
                    key={block.id}
                    variant={selectedBlockId === block.id ? "default" : "outline"}
                    onClick={() => setSelectedBlockId(block.id)}
                    size="sm"
                    className="flex-1 sm:flex-none min-w-[100px]"
                  >
                    {block.name}
                  </Button>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apartments Section */}
      {selectedBlockId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
              <Home className="h-5 w-5 md:h-6 md:w-6" />
              {t('apartments')}
            </h2>
            <Dialog open={isApartmentDialogOpen} onOpenChange={setIsApartmentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addApartment')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingApartment ? t('editApartment') : t('createApartment')}
                  </DialogTitle>
                </DialogHeader>
                <ApartmentForm
                  onSubmit={editingApartment ? handleEditApartment : handleCreateApartment}
                  initialData={editingApartment || undefined}
                  isEditing={!!editingApartment}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apartments
              .filter(apt => apt.blockId === selectedBlockId)
              .map(apartment => (
                <Card key={apartment.id} className="border-l-4 border-l-primary overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg truncate">
                        {t('apartment')} {apartment.number}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingApartment(apartment);
                            setIsApartmentDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleDeleteApartment(apartment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('type')}:</span>
                        <span className="font-medium">{apartment.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('surface')}:</span>
                        <span className="font-medium">{apartment.surface}m²</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{t('status')}:</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(apartment.status)}`}>
                          {apartment.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right italic">
                        {t('block')}: {getBlockName(apartment.blockId)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default Buildings;