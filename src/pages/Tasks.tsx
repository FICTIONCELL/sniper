import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTasks, useProjects, generateId } from "@/hooks/useLocalStorage";
import { Task } from "@/types";
import { Plus, Calendar, User, AlertTriangle, Clock, CheckCircle, Edit, Trash2 } from "lucide-react";
import { TaskForm } from "@/components/TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/contexts/TranslationContext";

const Tasks = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useTasks();
  const [projects] = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = (data: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
    setIsDialogOpen(false);
  };

  const handleUpdateTask = (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (!editingTask) return;

    setTasks(prev => prev.map(task =>
      task.id === editingTask.id
        ? { ...task, ...data }
        : task
    ));
    setEditingTask(null);
    setIsDialogOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const handleUpdateProgress = (taskId: string, progress: number) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, progress } : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (filterProject !== "all" && task.projectId !== filterProject) return false;
    return true;
  });

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'termine': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'faible': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'en_attente': return t('pending');
      case 'en_cours': return t('inProgress');
      case 'termine': return t('completed');
      default: return status;
    }
  };

  const getPriorityLabel = (priority: Task['priority']) => {
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

  const isTaskOverdue = (task: Task) => {
    const endDate = new Date(task.endDate);
    const today = new Date();
    return endDate < today && task.status !== 'termine';
  };

  const getDaysUntilDeadline = (task: Task) => {
    const endDate = new Date(task.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'en_attente': return Clock;
      case 'en_cours': return Calendar;
      case 'termine': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('tasks')}</h1>
          <p className="text-muted-foreground">{t('manageTasks')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('newTask')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('createTask')}</DialogTitle>
            </DialogHeader>
            <TaskForm onSubmit={handleCreateTask} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('filters')}:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="en_attente">{t('pending')}</SelectItem>
            <SelectItem value="en_cours">{t('inProgress')}</SelectItem>
            <SelectItem value="termine">{t('completed')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('project')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allProjects')}</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
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

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noTasks')}</h3>
            <p className="text-muted-foreground mb-4">
              {tasks.length === 0 ? t('startCreatingTask') : t('noTasksFound')}
            </p>
            {tasks.length === 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingTask ? t('editTask') : t('createTask')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTask ? t('editTask') : t('createTask')}
                    </DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    initialData={editingTask ? {
                      title: editingTask.title,
                      description: editingTask.description,
                      projectId: editingTask.projectId,
                      assignedTo: editingTask.assignedTo,
                      startDate: editingTask.startDate,
                      endDate: editingTask.endDate,
                      duration: editingTask.duration,
                      status: editingTask.status,
                      priority: editingTask.priority,
                      progress: editingTask.progress,
                      dependencies: editingTask.dependencies
                    } : undefined}
                  />
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {filteredTasks
            .sort((a, b) => {
              // Trier par priorité puis par date de fin
              const priorityOrder = { urgent: 0, normal: 1, faible: 2 };
              const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            })
            .map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              const overdue = isTaskOverdue(task);
              const daysLeft = getDaysUntilDeadline(task);

              return (
                <Card key={task.id} className={`hover:shadow-md transition-shadow ${overdue ? 'border-red-200 bg-red-50/30' :
                    task.priority === 'urgent' ? 'border-orange-200 bg-orange-50/30' : ''
                  }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          {overdue && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {task.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">{t('project')}</p>
                          <p>{getProjectName(task.projectId)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">{t('assignedTo')}</p>
                          <p>{task.assignedTo}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">{t('startDate')}</p>
                          <p>{new Date(task.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">{t('endDate')}</p>
                          <p className={overdue ? 'text-red-600 font-medium' : ''}>
                            {new Date(task.endDate).toLocaleDateString()}
                            {overdue && ` (${t('daysLate', { days: Math.abs(daysLeft) })})`}
                            {!overdue && daysLeft <= 7 && daysLeft > 0 && ` (${t('daysLeft', { days: daysLeft })})`}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">{t('progress')}</span>
                          <span className="text-sm text-muted-foreground">{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {task.status === 'en_attente' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTaskStatus(task.id, 'en_cours')}
                          >
                            {t('start')}
                          </Button>
                        )}
                        {task.status === 'en_cours' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTaskStatus(task.id, 'termine')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('finish')}
                          </Button>
                        )}
                        {task.status !== 'termine' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newProgress = prompt(t('updateProgressPrompt', { progress: task.progress }), task.progress.toString());
                              if (newProgress && !isNaN(Number(newProgress))) {
                                const progress = Math.max(0, Math.min(100, Number(newProgress)));
                                handleUpdateProgress(task.id, progress);
                              }
                            }}
                          >
                            {t('update')}
                          </Button>
                        )}
                      </div>

                      {task.dependencies && task.dependencies.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {t('dependsOn', { count: task.dependencies.length })}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingTask(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('edit')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{t('editTask')}</DialogTitle>
                            </DialogHeader>
                            <TaskForm
                              onSubmit={handleUpdateTask}
                              initialData={{
                                title: task.title,
                                description: task.description,
                                projectId: task.projectId,
                                assignedTo: task.assignedTo,
                                startDate: task.startDate,
                                endDate: task.endDate,
                                duration: task.duration,
                                status: task.status,
                                priority: task.priority,
                                progress: task.progress,
                                dependencies: task.dependencies
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
                                {t('deleteTaskWarning', { title: task.title })}
                                <br />
                                {t('irreversibleAction')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>
                                {t('delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Tasks;