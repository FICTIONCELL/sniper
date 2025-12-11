import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects, generateId } from "@/hooks/useLocalStorage";
import { Project } from "@/types";
import { Plus, Building2, Calendar, Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectForm } from "@/components/ProjectForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/contexts/TranslationContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Projects = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { canAddProject, isTrial, limits, isActive } = useSubscription();
  const [projects, setProjects] = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const canAdd = canAddProject(projects.length);

  const handleOpenDialog = () => {
    if (!isActive) {
      toast({
        title: t('subscriptionRequired') || 'Abonnement requis',
        description: t('subscriptionRequiredDesc') || 'Veuillez activer un abonnement pour ajouter des projets.',
        variant: "destructive"
      });
      return;
    }
    if (!canAdd) {
      toast({
        title: t('limitReached') || 'Limite atteinte',
        description: t('projectLimitReached') || `Vous avez atteint la limite de ${limits.maxProjects} projet(s) en mode essai.`,
        variant: "destructive"
      });
      return;
    }
    setIsDialogOpen(true);
  };

  const handleCreateProject = (data: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    setIsDialogOpen(false);
  };

  const handleUpdateProject = (data: Omit<Project, 'id' | 'createdAt'>) => {
    if (!editingProject) return;

    setProjects(prev => prev.map(project =>
      project.id === editingProject.id
        ? { ...project, ...data }
        : project
    ));
    setEditingProject(null);
    setIsDialogOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'termine': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'en_cours': return t('inProgress');
      case 'termine': return t('completed');
      case 'en_attente': return t('pending');
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('projects')}</h1>
          <p className="text-muted-foreground">{t('manageProjects')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} disabled={!isActive || !canAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {t('newProject')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('createProject')}</DialogTitle>
            </DialogHeader>
            <ProjectForm onSubmit={handleCreateProject} />
          </DialogContent>
        </Dialog>
      </div>

      {isTrial && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            {t('trialLimitInfo') || `Mode essai: ${projects.length}/${limits.maxProjects} projet(s) utilisé(s)`}
          </AlertDescription>
        </Alert>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noProjects')}</h3>
            <p className="text-muted-foreground mb-4">{t('startCreatingProject')}</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingProject ? t('editProject') : t('createProject')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProject ? t('editProject') : t('createProject')}
                  </DialogTitle>
                </DialogHeader>
                <ProjectForm
                  onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
                  initialData={editingProject ? {
                    name: editingProject.name,
                    description: editingProject.description,
                    startDate: editingProject.startDate,
                    endDate: editingProject.endDate,
                    status: editingProject.status
                  } : undefined}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">
                      {t('createdOn')} {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          {t('viewDetails')}
                        </Button>
                      </Link>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingProject(project)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('edit')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{t('editProject')}</DialogTitle>
                          </DialogHeader>
                          <ProjectForm
                            onSubmit={handleUpdateProject}
                            initialData={{
                              name: project.name,
                              description: project.description,
                              startDate: project.startDate,
                              endDate: project.endDate,
                              status: project.status
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('deleteProjectWarning', { name: project.name })}
                              <br />
                              {t('irreversibleAction')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

export default Projects;