import { useState, useMemo } from "react";
import { useTasks, useProjects, generateId } from "@/hooks/useLocalStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import { Task } from "@/types";
import {
  Calendar,
  TableIcon,
  GanttChartSquare,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronUp,
  ChevronDown,
  Plus,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";

type ViewMode = 'table' | 'gantt';
type TimeScale = 'day' | 'month' | 'year';
type PriorityFilter = 'all' | 'urgent' | 'normal' | 'faible';

const PlanningNew = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tasks, setTasks] = useTasks();
  const [projects] = useProjects();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [timeScale, setTimeScale] = useState<TimeScale>('month');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const handleCreateTask = (data: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
    setIsTaskDialogOpen(false);
    toast({
      title: t('taskCreated'),
      description: t('taskAddedToPlanning'),
    });
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || t('unknownProject');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'faible': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'en_cours': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'termine': return 'bg-green-500/10 text-green-700 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente': return t('pending');
      case 'en_cours': return t('inProgress');
      case 'termine': return t('completed');
      default: return status;
    }
  };

  const isTaskOverdue = (task: any) => {
    const endDate = new Date(task.endDate);
    const today = new Date();
    return endDate < today && task.status !== 'termine';
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.projectId === projectFilter);
    }

    return filtered.sort((a, b) => {
      // Sort by priority first, then by start date
      const priorityOrder = { urgent: 3, normal: 2, faible: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [tasks, priorityFilter, projectFilter]);

  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    const currentIndex = filteredTasks.findIndex(task => task.id === taskId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= filteredTasks.length) return;

    const updatedTasks = [...tasks];
    const taskToMove = updatedTasks.find(task => task.id === taskId);
    const targetTask = filteredTasks[newIndex];

    if (taskToMove && targetTask) {
      // Swap priorities to maintain order
      const tempPriority = taskToMove.priority;
      taskToMove.priority = targetTask.priority;
      const targetInUpdated = updatedTasks.find(task => task.id === targetTask.id);
      if (targetInUpdated) {
        targetInUpdated.priority = tempPriority;
      }
    }

    setTasks(updatedTasks);
    toast({
      title: t('taskMoved'),
      description: t('taskMovedDirection', { direction: direction === 'up' ? t('up') : t('down') }),
    });
  };

  const handleExport = () => {
    const csvData = [
      [t('title'), t('description'), t('project'), t('assignedTo'), t('startDate'), t('endDate'), t('status'), t('priority'), t('progress')],
      ...filteredTasks.map(task => [
        task.title,
        task.description,
        getProjectName(task.projectId),
        task.assignedTo,
        task.startDate,
        task.endDate,
        getStatusLabel(task.status),
        task.priority,
        `${task.progress}%`
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `planning_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t('exportSuccess'),
      description: t('excelExportDescription'),
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      if (viewMode === 'table') {
        // Print table view
        printWindow.document.write(`
          <html>
            <head>
              <title>${t('planning')} - ${new Date().toLocaleDateString()}</title>
              <style>
                body { font-family: Arial, sans-serif; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .urgent { background-color: #fee; }
                .normal { background-color: #eef; }
                .faible { background-color: #f9f9f9; }
              </style>
            </head>
            <body>
              <h1>${t('taskPlanning')}</h1>
              <p>${t('generatedOn')}: ${new Date().toLocaleString()}</p>
              <table>
                <thead>
                  <tr>
                    <th>${t('title')}</th>
                    <th>${t('project')}</th>
                    <th>${t('assignedTo')}</th>
                    <th>${t('startDate')}</th>
                    <th>${t('endDate')}</th>
                    <th>${t('status')}</th>
                    <th>${t('priority')}</th>
                    <th>${t('progress')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredTasks.map(task => `
                    <tr class="${task.priority}">
                      <td>${task.title}</td>
                      <td>${getProjectName(task.projectId)}</td>
                      <td>${task.assignedTo}</td>
                      <td>${new Date(task.startDate).toLocaleDateString()}</td>
                      <td>${new Date(task.endDate).toLocaleDateString()}</td>
                      <td>${getStatusLabel(task.status)}</td>
                      <td>${task.priority}</td>
                      <td>${task.progress}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
      } else {
        // Print Gantt view with visual bars
        const allDates = filteredTasks.flatMap(task => [new Date(task.startDate), new Date(task.endDate)]);
        const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
        const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();

        // Add padding
        minDate.setDate(minDate.getDate() - 5);
        maxDate.setDate(maxDate.getDate() + 5);

        const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

        const getBarPosition = (task: any) => {
          const startDate = new Date(task.startDate);
          const endDate = new Date(task.endDate);
          const startOffset = Math.floor((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
          const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const left = (startOffset / totalDays) * 100;
          const width = (duration / totalDays) * 100;
          return { left, width };
        };

        const getBarColor = (task: any) => {
          if (task.status === 'termine') return '#22c55e';
          if (isTaskOverdue(task)) return '#ef4444';
          if (task.status === 'en_cours') return '#f97316';
          return '#3b82f6';
        };

        // Generate month headers
        const months: string[] = [];
        let current = new Date(minDate);
        while (current <= maxDate) {
          months.push(current.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
          current.setMonth(current.getMonth() + 1);
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>${t('planning')} Gantt - ${new Date().toLocaleDateString()}</title>
              <style>
                @page { size: landscape; margin: 10mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                h1 { margin-bottom: 5px; }
                .subtitle { color: #666; margin-bottom: 20px; }
                .gantt-container { width: 100%; overflow: visible; }
                .gantt-header { display: flex; border-bottom: 2px solid #333; background: #f5f5f5; }
                .task-column { width: 200px; min-width: 200px; padding: 8px; font-weight: bold; border-right: 1px solid #ddd; }
                .timeline-header { flex: 1; display: flex; }
                .month-cell { flex: 1; padding: 8px; text-align: center; border-right: 1px solid #ddd; font-size: 11px; }
                .task-row { display: flex; border-bottom: 1px solid #ddd; min-height: 40px; }
                .task-info { width: 200px; min-width: 200px; padding: 8px; border-right: 1px solid #ddd; }
                .task-name { font-weight: bold; font-size: 12px; }
                .task-project { color: #666; font-size: 10px; }
                .task-meta { font-size: 9px; color: #888; margin-top: 2px; }
                .timeline-area { flex: 1; position: relative; }
                .task-bar { position: absolute; height: 20px; top: 10px; border-radius: 3px; color: white; font-size: 10px; display: flex; align-items: center; justify-content: center; }
                .legend { display: flex; gap: 20px; margin-top: 20px; font-size: 11px; }
                .legend-item { display: flex; align-items: center; gap: 5px; }
                .legend-color { width: 16px; height: 16px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <h1>${t('taskPlanning')} - Diagramme de Gantt</h1>
              <p class="subtitle">${t('generatedOn')}: ${new Date().toLocaleString()} | Échelle: ${timeScale === 'day' ? 'Jour' : timeScale === 'month' ? 'Mois' : 'Année'}</p>
              
              <div class="gantt-container">
                <div class="gantt-header">
                  <div class="task-column">${t('tasks')}</div>
                  <div class="timeline-header">
                    ${months.map(m => `<div class="month-cell">${m}</div>`).join('')}
                  </div>
                </div>
                
                ${filteredTasks.map(task => {
          const pos = getBarPosition(task);
          const color = getBarColor(task);
          return `
                    <div class="task-row">
                      <div class="task-info">
                        <div class="task-name">${task.title}</div>
                        <div class="task-project">${getProjectName(task.projectId)}</div>
                        <div class="task-meta">${task.priority} | ${getStatusLabel(task.status)}</div>
                      </div>
                      <div class="timeline-area">
                        <div class="task-bar" style="left: ${pos.left}%; width: ${Math.max(pos.width, 2)}%; background-color: ${color};">
                          ${task.progress}%
                        </div>
                      </div>
                    </div>
                  `;
        }).join('')}
              </div>
              
              <div class="legend">
                <div class="legend-item"><div class="legend-color" style="background: #22c55e;"></div> Terminé</div>
                <div class="legend-item"><div class="legend-color" style="background: #f97316;"></div> En cours</div>
                <div class="legend-item"><div class="legend-color" style="background: #3b82f6;"></div> En attente</div>
                <div class="legend-item"><div class="legend-color" style="background: #ef4444;"></div> En retard</div>
              </div>
            </body>
          </html>
        `);
      }
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: t('printStarted'),
      description: viewMode === 'gantt' ? 'Impression du diagramme Gantt...' : t('printWindowOpened'),
    });
  };

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5" />
          {t('tableView')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">{t('actions')}</th>
                <th className="text-left p-3 font-medium">{t('title')}</th>
                <th className="text-left p-3 font-medium">{t('project')}</th>
                <th className="text-left p-3 font-medium">{t('assignedTo')}</th>
                <th className="text-left p-3 font-medium">{t('period')}</th>
                <th className="text-left p-3 font-medium">{t('status')}</th>
                <th className="text-left p-3 font-medium">{t('priority')}</th>
                <th className="text-left p-3 font-medium">{t('progress')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => (
                <tr key={task.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveTask(task.id, 'up')}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === filteredTasks.length - 1}
                        onClick={() => moveTask(task.id, 'down')}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      {isTaskOverdue(task) && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {getProjectName(task.projectId)}
                  </td>
                  <td className="p-3 text-sm">{task.assignedTo}</td>
                  <td className="p-3 text-sm">
                    {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <Badge className={getStatusColor(task.status)} variant="outline">
                      {getStatusLabel(task.status)}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={getPriorityColor(task.priority)} variant="outline">
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {task.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noTasksFound')}</h3>
              <p className="text-muted-foreground">{t('adjustFiltersOrCreateNewTask')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderGanttView = () => {
    // Calculate time range
    const allDates = filteredTasks.flatMap(task => [new Date(task.startDate), new Date(task.endDate)]);
    const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
    const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();

    // Generate time units based on scale
    const generateTimeUnits = () => {
      const units = [];
      let current = new Date(minDate);
      current.setDate(1); // Start of month/year

      while (current <= maxDate) {
        switch (timeScale) {
          case 'day':
            units.push(new Date(current));
            current.setDate(current.getDate() + 1);
            break;
          case 'month':
            units.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
            break;
          case 'year':
            units.push(new Date(current));
            current.setFullYear(current.getFullYear() + 1);
            break;
        }

        // Prevent infinite loop
        if (units.length > 100) break;
      }
      return units;
    };

    const timeUnits = generateTimeUnits();
    const totalUnits = timeUnits.length;

    const getTaskBarStyle = (task: any) => {
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);

      // Find position in time units
      let startIndex = 0;
      let endIndex = totalUnits - 1;

      for (let i = 0; i < timeUnits.length; i++) {
        const unitStart = timeUnits[i];
        const unitEnd = new Date(unitStart);

        switch (timeScale) {
          case 'day':
            unitEnd.setDate(unitEnd.getDate() + 1);
            break;
          case 'month':
            unitEnd.setMonth(unitEnd.getMonth() + 1);
            break;
          case 'year':
            unitEnd.setFullYear(unitEnd.getFullYear() + 1);
            break;
        }

        if (startDate >= unitStart && startDate < unitEnd) {
          startIndex = i;
        }
        if (endDate >= unitStart && endDate < unitEnd) {
          endIndex = i;
        }
      }

      const left = (startIndex / totalUnits) * 100;
      const width = ((endIndex - startIndex + 1) / totalUnits) * 100;

      return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
    };

    const getTaskBarColor = (task: any) => {
      const isOverdue = isTaskOverdue(task);

      if (task.status === 'termine') return 'bg-green-500'; // Vert terminé
      if (isOverdue) return 'bg-red-500'; // Rouge en retard  
      if (task.status === 'en_cours') return 'bg-orange-500'; // Orange en cours
      return 'bg-blue-500'; // Bleu en attente
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChartSquare className="h-5 w-5" />
            {t('ganttView')} ({timeScale === 'day' ? t('perDay') : timeScale === 'month' ? t('perMonth') : t('perYear')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Scrollable Container with custom scrollbar */}
          <div className="relative">
            {/* Fixed task column overlay hint */}
            <div className="absolute left-60 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted" style={{ maxHeight: '70vh' }}>
              <div style={{ minWidth: `${Math.max(1200, timeUnits.length * (timeScale === 'day' ? 60 : timeScale === 'month' ? 100 : 150))}px` }}>
                {/* Timeline Header */}
                <div className="flex border-b bg-muted/20">
                  <div className="w-60 p-3 font-medium border-r bg-background">
                    {t('tasks')}
                  </div>
                  <div className="flex-1 relative">
                    <div className="flex h-12">
                      {timeUnits.map((unit, index) => (
                        <div
                          key={index}
                          className="flex-1 p-2 text-xs border-r text-center bg-muted/10"
                          style={{ minWidth: `${100 / totalUnits}%` }}
                        >
                          {timeScale === 'day' && unit.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          {timeScale === 'month' && unit.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          {timeScale === 'year' && unit.getFullYear()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks Rows */}
                <div className="space-y-0">
                  {filteredTasks.map((task, index) => {
                    const barStyle = getTaskBarStyle(task);
                    const barColor = getTaskBarColor(task);

                    return (
                      <div key={task.id} className="flex border-b hover:bg-muted/30 transition-colors">
                        {/* Task Info Column */}
                        <div className="w-60 p-3 border-r bg-background">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={index === 0}
                                onClick={() => moveTask(task.id, 'up')}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={index === filteredTasks.length - 1}
                                onClick={() => moveTask(task.id, 'down')}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-medium text-sm truncate flex-1">{task.title}</span>
                            {isTaskOverdue(task) && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getProjectName(task.projectId)}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Badge className={getPriorityColor(task.priority)} variant="outline">
                              {task.priority}
                            </Badge>
                            <Badge className={getStatusColor(task.status)} variant="outline">
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>
                        </div>

                        {/* Gantt Bar Column */}
                        <div className="flex-1 relative p-2" style={{ minHeight: '60px' }}>
                          <div className="relative h-6 mt-2">
                            {/* Task Bar */}
                            <div
                              className={`absolute h-6 rounded cursor-pointer transition-all duration-200 hover:opacity-80 ${barColor}`}
                              style={barStyle}
                              onClick={() => setSelectedTask(task)}
                              draggable
                              onDragStart={() => setDraggedTask(task.id)}
                              onDragEnd={() => setDraggedTask(null)}
                            >
                              {/* Progress Indicator */}
                              <div
                                className="absolute top-0 left-0 h-full bg-white/30 rounded"
                                style={{ width: `${task.progress}%` }}
                              />

                              {/* Task Label */}
                              <div className="absolute inset-0 flex items-center px-2 text-white text-xs font-medium truncate">
                                {task.progress}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <GanttChartSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('noTasksDisplay')}</h3>
                    <p className="text-muted-foreground">{t('createTasksForGantt')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Task Detail Modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
              <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">{selectedTask.title}</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">{t('project')}:</span>
                    <p className="text-sm text-muted-foreground">{getProjectName(selectedTask.projectId)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('assignedTo')}:</span>
                    <p className="text-sm text-muted-foreground">{selectedTask.assignedTo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('period')}:</span>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTask.startDate).toLocaleDateString()} - {new Date(selectedTask.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('status')}:</span>
                    <Badge className={getStatusColor(selectedTask.status)} variant="outline">
                      {getStatusLabel(selectedTask.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('priority')}:</span>
                    <Badge className={getPriorityColor(selectedTask.priority)} variant="outline">
                      {selectedTask.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t('progress')}:</span>
                    <p className="text-sm text-muted-foreground">{selectedTask.progress}%</p>
                  </div>
                  {selectedTask.description && (
                    <div>
                      <span className="text-sm font-medium">{t('description')}:</span>
                      <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => setSelectedTask(null)}
                >
                  {t('close')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('interactivePlanning')}</h1>
        <p className="text-muted-foreground">{t('planningDescription')}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('newTask')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('createTask')}</DialogTitle>
                </DialogHeader>
                <TaskForm onSubmit={handleCreateTask} />
              </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-border mx-2" />

            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              {t('table')}
            </Button>
            <Button
              variant={viewMode === 'gantt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('gantt')}
            >
              <GanttChartSquare className="h-4 w-4 mr-2" />
              {t('gantt')}
            </Button>
          </div>

          {/* Time Scale (only for Gantt) */}
          {viewMode === 'gantt' && (
            <Select value={timeScale} onValueChange={(value: TimeScale) => setTimeScale(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('perDay')}</SelectItem>
                <SelectItem value="month">{t('perMonth')}</SelectItem>
                <SelectItem value="year">{t('perYear')}</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allProjects')}</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value: PriorityFilter) => setPriorityFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
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

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('print')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? renderTableView() : renderGanttView()}
    </div>
  );
};

export default PlanningNew;