import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, CheckCircle, Building2, Users, Calendar, LayoutGrid, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProjects, useReserves, useReceptions, useContractors, useTasks, generateId } from "@/hooks/useLocalStorage";
import { CompactReserveForm } from "@/components/CompactReserveForm";
import { useTranslation } from "@/contexts/TranslationContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Reserve, Reception, Task } from "@/types";

interface SettingsData {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: 'fr' | 'ar' | 'en' | 'es';
  compactMode: boolean;
}

const CompactDashboard = () => {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [isCompactMode, setIsCompactMode] = useLocalStorage("compactMode", true);
  
  const [projects] = useProjects();
  const [reserves, setReserves] = useReserves();
  const [receptions, setReceptions] = useReceptions();
  const [contractors] = useContractors();
  const [tasks] = useTasks();

  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);

  const handleModeToggle = () => {
    setIsCompactMode(!isCompactMode);
    if (isCompactMode) {
      // Passer au mode normal
      window.location.href = '/';
      toast({
        title: t('normalModeActivated') || "Mode Normal Activé",
        description: t('normalModeDescription') || "Interface complète avec menu latéral",
      });
    }
  };

  const handleCreateReserve = (data: Omit<Reserve, 'id' | 'createdAt'>) => {
    const newReserve: Reserve = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    setReserves(prev => [...prev, newReserve]);
    setIsReserveDialogOpen(false);
    toast({
      title: t('reserveCreated') || "Réserve créée",
      description: t('reserveCreatedDescription') || "La réserve a été créée avec succès",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'normal': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'faible': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ouverte': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'en_cours': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolue': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Filter recent items
  const recentReserves = reserves.slice(-5);
  const recentReceptions = receptions.slice(-3);
  const urgentTasks = tasks.filter(task => task.priority === 'urgent').slice(-3);

  const stats = [
    {
      title: t('projects') || 'Projets',
      value: projects.length,
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: t('reserves') || 'Réserves',
      value: reserves.length,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      title: t('receptions') || 'Réceptions',
      value: receptions.length,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: t('contractors') || 'Sous-traitants',
      value: contractors.length,
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Bar Compact */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">
              {t('compactDashboard') || 'Tableau de Bord Compact'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleModeToggle}
              className="gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              {t('normalMode') || 'Mode Normal'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          {t('quickAccess') || 'Accès rapide aux fonctionnalités essentielles'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('quickActions') || 'Actions Rapides'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t('addReserve') || 'Ajouter Réserve'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('createReserve') || 'Créer une Réserve'}</DialogTitle>
              </DialogHeader>
              <CompactReserveForm
                onSubmit={handleCreateReserve}
                onClose={() => setIsReserveDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="w-full" size="sm" onClick={() => window.location.href = '/receptions'}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('addReception') || 'Ajouter Réception'}
          </Button>
          
          <Button variant="outline" className="w-full" size="sm" onClick={() => window.location.href = '/tasks'}>
            <Calendar className="h-4 w-4 mr-2" />
            {t('addTask') || 'Ajouter Tâche'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reserves */}
      {recentReserves.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('recentReserves') || 'Réserves Récentes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReserves.map(reserve => (
              <div key={reserve.id} className="p-2 border rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm truncate">{reserve.title}</h4>
                  <div className="flex gap-1">
                    <Badge className={getPriorityColor(reserve.priority)}>
                      {reserve.priority}
                    </Badge>
                    <Badge className={getStatusColor(reserve.status)}>
                      {reserve.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {reserve.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Receptions */}
      {recentReceptions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {t('recentReceptions') || 'Réceptions Récentes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReceptions.map(reception => (
              <div key={reception.id} className="p-2 border rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm">{t('reception') || 'Réception'} #{reception.id.slice(-4)}</h4>
                  <Badge className={reception.hasReserves ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {reception.hasReserves ? t('withReserves') || 'Avec réserves' : t('validated') || 'Validée'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(reception.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Urgent Tasks */}
      {urgentTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('urgentTasks') || 'Tâches Urgentes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentTasks.map(task => (
              <div key={task.id} className="p-2 border rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm truncate">{task.title}</h4>
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    {t('urgent') || 'Urgent'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('deadline') || 'Échéance'}: {new Date(task.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default CompactDashboard;