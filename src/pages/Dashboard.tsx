import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects, useReserves, useTasks, useContractors } from "@/hooks/useLocalStorage";
import { ProjectWizard } from "@/components/ProjectWizard";
import { Plus, Building2, AlertTriangle, CheckCircle, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects] = useProjects();
  const [reserves] = useReserves();
  const [tasks] = useTasks();
  const [contractors] = useContractors();

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'en_cours').length,
    openReserves: reserves.filter(r => r.status === 'ouverte').length,
    urgentReserves: reserves.filter(r => r.priority === 'urgent' && r.status === 'ouverte').length,
    activeTasks: tasks.filter(t => t.status === 'en_cours').length,
    expiredContracts: contractors.filter(c => {
      const endDate = new Date(c.contractEnd);
      const today = new Date();
      return endDate < today && c.status === 'actif';
    }).length,
  };

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { t, language } = useTranslation();

  return (
    <div className="p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
          <p className="text-muted-foreground">{t('welcomeMessage')}</p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          {t('newProjectWizard') || "Assistant Nouveau Projet"}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" onClick={() => setIsWizardOpen(true)}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t('createProject')}</h3>
              <p className="text-xs text-muted-foreground">{t('withWizard')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" onClick={() => navigate('/reserves')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t('newReserve')}</h3>
              <p className="text-xs text-muted-foreground">{t('reportIssue')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" onClick={() => navigate('/receptions')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-300">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t('generatePV')}</h3>
              <p className="text-xs text-muted-foreground">{t('receptionReport')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" onClick={() => navigate('/planning')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full text-purple-600 dark:text-purple-300">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t('planning')}</h3>
              <p className="text-xs text-muted-foreground">{t('manageTasks')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/projects')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeProjects')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {t('totalProjectsCount').replace('{count}', stats.totalProjects.toString())}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/reserves')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('openReserves')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openReserves}</div>
            <p className="text-xs text-muted-foreground">
              {t('urgentReservesCount').replace('{count}', stats.urgentReserves.toString())}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/tasks')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeTasks')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              {t('executingTasks')}
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigate('/contractors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('expiredContracts')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expiredContracts}</div>
            <p className="text-xs text-muted-foreground">
              {t('attentionRequired')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('recentProjects')}</CardTitle>
            <CardDescription>{t('lastCreatedProjects')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.status}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noProjectsCreated')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('urgentReserves')}</CardTitle>
            <CardDescription>{t('immediateAttentionRequired')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reserves.filter(r => r.priority === 'urgent' && r.status === 'ouverte').slice(0, 5).map((reserve) => (
                <div key={reserve.id} className="flex items-center justify-between p-2 border rounded border-destructive/20">
                  <div>
                    <p className="font-medium">{reserve.title}</p>
                    <p className="text-sm text-muted-foreground">{reserve.status}</p>
                  </div>
                  <span className="text-xs text-destructive font-medium">
                    {reserve.priority}
                  </span>
                </div>
              ))}
              {reserves.filter(r => r.priority === 'urgent' && r.status === 'ouverte').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noUrgentReserves')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjectWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />
    </div>
  );
};

export default Dashboard;