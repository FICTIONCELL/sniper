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


      <div className="p-2 md:p-4 space-y-4 w-full max-w-none">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.map((stat, index) => (
            <Card key={index} className="p-3 border shadow-sm">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-6 w-6 ${stat.color} shrink-0`} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.title}</p>
                  <p className="text-xl font-bold leading-none">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {t('quickActions') || 'Actions Rapides'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
            <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 text-base" size="lg">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {t('addReserve') || 'Ajouter Réserve'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full sm:max-w-md h-[100dvh] sm:h-auto p-0 sm:p-6 overflow-y-auto">
                <DialogHeader className="p-4 sm:p-0 border-b sm:border-none">
                  <DialogTitle>{t('createReserve') || 'Créer une Réserve'}</DialogTitle>
                </DialogHeader>
                <div className="p-4 sm:p-0">
                  <CompactReserveForm
                    onSubmit={handleCreateReserve}
                    onClose={() => setIsReserveDialogOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full h-12 text-base" size="lg" onClick={() => window.location.href = '/receptions'}>
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              {t('addReception') || 'Ajouter Réception'}
            </Button>

            <Button variant="outline" className="w-full h-12 text-base" size="lg" onClick={() => window.location.href = '/tasks'}>
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              {t('addTask') || 'Ajouter Tâche'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Reserves */}
          {recentReserves.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  {t('recentReserves') || 'Réserves Récentes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {recentReserves.map(reserve => (
                  <div key={reserve.id} className="p-3 border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{reserve.title}</h4>
                      <div className="flex gap-1 shrink-0">
                        <Badge className={`${getPriorityColor(reserve.priority)} text-[10px] px-1.5 py-0`}>
                          {reserve.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground line-clamp-1 flex-1 mr-2">
                        {reserve.description}
                      </p>
                      <Badge className={`${getStatusColor(reserve.status)} text-[10px] px-1.5 py-0`}>
                        {reserve.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {/* Recent Receptions */}
            {recentReceptions.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {t('recentReceptions') || 'Réceptions Récentes'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  {recentReceptions.map(reception => (
                    <div key={reception.id} className="p-3 border rounded-xl bg-muted/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-sm">{t('reception') || 'Réception'} #{reception.id.slice(-4)}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reception.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={`${reception.hasReserves ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} text-[10px]`}>
                          {reception.hasReserves ? t('withReserves') || 'Avec réserves' : t('validated') || 'Validée'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Urgent Tasks */}
            {urgentTasks.length > 0 && (
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    {t('urgentTasks') || 'Tâches Urgentes'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  {urgentTasks.map(task => (
                    <div key={task.id} className="p-3 border rounded-xl bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-sm line-clamp-1">{task.title}</h4>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-[10px]">
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
      </div>
    </div>
  );
};

export default CompactDashboard;