import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects, useBlocks, useApartments, generateId } from "@/hooks/useLocalStorage";
import { Block, Apartment } from "@/types";
import { ArrowLeft, Plus, Building, Home } from "lucide-react";
import { BlockForm } from "@/components/BlockForm";
import { ApartmentForm } from "@/components/ApartmentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "@/contexts/TranslationContext";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [projects] = useProjects();
  const [blocks, setBlocks] = useBlocks();
  const [apartments, setApartments] = useApartments();
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isApartmentDialogOpen, setIsApartmentDialogOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");

  const project = projects.find(p => p.id === id);
  const projectBlocks = blocks.filter(b => b.projectId === id);
  const projectApartments = apartments.filter(a => a.projectId === id);

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('projectNotFound')}</h1>
          <Link to="/projects">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToProjects')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCreateBlock = (data: Omit<Block, 'id' | 'projectId' | 'createdAt'>) => {
    const newBlock: Block = {
      ...data,
      id: generateId(),
      projectId: project.id,
      createdAt: new Date().toISOString(),
    };
    setBlocks(prev => [...prev, newBlock]);
    setIsBlockDialogOpen(false);
  };

  const handleCreateApartment = (data: Omit<Apartment, 'id' | 'projectId' | 'blockId' | 'createdAt'>) => {
    if (!selectedBlockId) return;

    const newApartment: Apartment = {
      ...data,
      id: generateId(),
      projectId: project.id,
      blockId: selectedBlockId,
      createdAt: new Date().toISOString(),
    };
    setApartments(prev => [...prev, newApartment]);
    setIsApartmentDialogOpen(false);
    setSelectedBlockId("");
  };

  const getApartmentsByBlock = (blockId: string) => {
    return apartments.filter(a => a.blockId === blockId);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours': return t('inProgress');
      case 'termine': return t('completed');
      case 'en_attente': return t('pending');
      case 'libre': return t('free');
      case 'reserve': return t('reserved');
      case 'vendu': return t('sold');
      default: return status;
    }
  };

  const getTypeLabel = (type: Apartment['type']) => {
    switch (type) {
      case 'appartement': return t('apartment');
      case 'villa': return t('villa');
      case 'studio': return t('studio');
      case 'duplex': return t('duplex');
      default: return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <Badge className={
          project.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
            project.status === 'termine' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
        }>
          {getStatusLabel(project.status)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('projectInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">{t('startDate')}</p>
              <p className="text-muted-foreground">{new Date(project.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('endDate')}</p>
              <p className="text-muted-foreground">{new Date(project.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('createdOn')}</p>
              <p className="text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="blocks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocks">{t('blocks')} ({projectBlocks.length})</TabsTrigger>
          <TabsTrigger value="apartments">{t('apartments')} ({projectApartments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('projectBlocks')}</h2>
            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addBlock')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('createBlock')}</DialogTitle>
                </DialogHeader>
                <BlockForm onSubmit={handleCreateBlock} />
              </DialogContent>
            </Dialog>
          </div>

          {projectBlocks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noBlocks')}</h3>
                <p className="text-muted-foreground mb-4">{t('addFirstBlock')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectBlocks.map((block) => {
                const blockApartments = getApartmentsByBlock(block.id);
                return (
                  <Card key={block.id}>
                    <CardHeader>
                      <CardTitle>{block.name}</CardTitle>
                      <CardDescription>{block.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">{blockApartments.length}</span> {t('apartments').toLowerCase()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBlockId(block.id);
                            setIsApartmentDialogOpen(true);
                          }}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t('addApartment')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="apartments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('projectApartments')}</h2>
          </div>

          {projectApartments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noApartments')}</h3>
                <p className="text-muted-foreground mb-4">{t('createBlocksFirst')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectApartments.map((apartment) => {
                const block = projectBlocks.find(b => b.id === apartment.blockId);
                return (
                  <Card key={apartment.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{getTypeLabel(apartment.type)} {apartment.number}</span>
                        <Badge variant={
                          apartment.status === 'libre' ? 'secondary' :
                            apartment.status === 'reserve' ? 'default' :
                              'destructive'
                        }>
                          {getStatusLabel(apartment.status)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{t('block')}: {block?.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {t('surface')}: {apartment.surface} m²
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isApartmentDialogOpen} onOpenChange={setIsApartmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createApartment')}</DialogTitle>
          </DialogHeader>
          <ApartmentForm onSubmit={handleCreateApartment} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;