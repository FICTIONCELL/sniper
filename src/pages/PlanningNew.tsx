import { useState, useMemo, useRef } from "react";
import { useTasks, useProjects, useContractors, useCategories, useReserves, generateId } from "@/hooks/useLocalStorage";
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
  const [contractors] = useContractors();
  const [categories] = useCategories();
  const [reserves] = useReserves();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [timeScale, setTimeScale] = useState<TimeScale>('month');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'task' | 'contractor'>('all');

  // Drag to scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setStartY(e.pageY - scrollContainerRef.current.offsetTop);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setScrollTop(scrollContainerRef.current.scrollTop);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const y = e.pageY - scrollContainerRef.current.offsetTop;
    const walkX = (x - startX);
    const walkY = (y - startY);
    scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
    scrollContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setStartY(e.touches[0].pageY - scrollContainerRef.current.offsetTop);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setScrollTop(scrollContainerRef.current.scrollTop);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const y = e.touches[0].pageY - scrollContainerRef.current.offsetTop;
    const walkX = (x - startX);
    const walkY = (y - startY);
    scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
    scrollContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const handleTouchEnd = () => setIsDragging(false);

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

  const calculateProgress = (startDate: string, endDate: string, projectId: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const totalDuration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    let elapsedDays = 0;
    if (today > start) {
      elapsedDays = Math.min(totalDuration, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const projectReserves = reserves.filter(r => r.projectId === projectId && r.status !== 'resolue').length;
    const reserveWeight = 0.05;
    const progressTemps = (elapsedDays / totalDuration) * 100;
    const impactReserves = projectReserves * reserveWeight * 100;
    return Math.max(0, Math.round(progressTemps * (1 - impactReserves / 100)));
  };

  const combinedItems = useMemo(() => {
    const contractorItems = contractors.map(contractor => {
      const categoryName = categories.find(c => c.id === contractor.categoryIds[0])?.name || t('noCategory');
      return {
        id: contractor.id,
        title: `${categoryName}_${contractor.specialty}`,
        description: contractor.name,
        projectId: contractor.projectId,
        assignedTo: contractor.name,
        startDate: contractor.contractStart,
        endDate: contractor.contractEnd,
        status: contractor.status === 'actif' ? 'en_cours' : 'en_attente',
        priority: 'normal',
        progress: calculateProgress(contractor.contractStart, contractor.contractEnd, contractor.projectId),
        type: 'contractor' as const,
      };
    });

    const taskItems = tasks.map(task => ({
      ...task,
      progress: calculateProgress(task.startDate, task.endDate, task.projectId),
      type: 'task' as const
    }));

    let combined = [...taskItems, ...contractorItems];
    if (priorityFilter !== 'all') combined = combined.filter(item => item.priority === priorityFilter);
    if (projectFilter !== 'all') combined = combined.filter(item => item.projectId === projectFilter);
    if (typeFilter !== 'all') combined = combined.filter(item => item.type === typeFilter);

    return combined.sort((a, b) => {
      const priorityOrder = { urgent: 3, normal: 2, faible: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [tasks, contractors, categories, priorityFilter, projectFilter, typeFilter, reserves, t]);

  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    toast({
      title: t('itemMoved'),
      description: direction === 'up' ? t('up') : t('down'),
    });
  };

  const handleExport = () => {
    const csvData = [
      [t('title'), t('type'), t('project'), t('assignedTo'), t('startDate'), t('endDate'), t('status'), t('priority'), t('progress')],
      ...combinedItems.map(task => [
        task.title,
        task.type,
        getProjectName(task.projectId),
        task.assignedTo,
        task.startDate,
        task.endDate,
        task.status,
        task.priority,
        `${task.progress}%`
      ])
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `planning.csv`;
    link.click();
  };

  const handlePrint = () => window.print();

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TableIcon className="h-5 w-5" /> {t('tableView')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">{t('actions')}</th>
                <th className="p-3 font-medium">{t('title')}</th>
                <th className="p-3 font-medium">{t('type')}</th>
                <th className="p-3 font-medium">{t('project')}</th>
                <th className="p-3 font-medium">{t('assignedTo')}</th>
                <th className="p-3 font-medium">{t('period')}</th>
                <th className="p-3 font-medium">{t('status')}</th>
                <th className="p-3 font-medium">{t('priority')}</th>
                <th className="p-3 font-medium">{t('progress')}</th>
              </tr>
            </thead>
            <tbody>
              {combinedItems.map((task, index) => (
                <tr key={task.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => moveTask(task.id, 'up')}><ChevronUp className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" disabled={index === combinedItems.length - 1} onClick={() => moveTask(task.id, 'down')}><ChevronDown className="h-4 w-4" /></Button>
                    </div>
                  </td>
                  <td className="p-3 font-medium">{task.title}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={task.type === 'task' ? 'bg-blue-500/10 text-blue-700' : 'bg-purple-500/10 text-purple-700'}>{task.type}</Badge>
                  </td>
                  <td className="p-3 text-sm">{getProjectName(task.projectId)}</td>
                  <td className="p-3 text-sm">{task.assignedTo}</td>
                  <td className="p-3 text-sm">{new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}</td>
                  <td className="p-3"><Badge className={getStatusColor(task.status)} variant="outline">{getStatusLabel(task.status)}</Badge></td>
                  <td className="p-3"><Badge className={getPriorityColor(task.priority)} variant="outline">{task.priority}</Badge></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-xs">{task.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderGanttView = () => {
    const allDates = combinedItems.flatMap(task => [new Date(task.startDate), new Date(task.endDate)]);
    const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
    const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date();

    const generateTimeUnits = () => {
      const units = [];
      let current = new Date(minDate);
      current.setDate(1); 
      while (current <= maxDate) {
        switch (timeScale) {
          case 'day': units.push(new Date(current)); current.setDate(current.getDate() + 1); break;
          case 'month': units.push(new Date(current)); current.setMonth(current.getMonth() + 1); break;
          case 'year': units.push(new Date(current)); current.setFullYear(current.getFullYear() + 1); break;
        }
        if (units.length > 200) break;
      }
      return units;
    };

    const timeUnits = generateTimeUnits();
    const totalUnits = timeUnits.length;

    // --- CALCUL DE LA LIGNE ROUGE ---
    const getTodayPosition = () => {
      const today = new Date();
      if (today < minDate || today > maxDate) return null;
      const totalMs = maxDate.getTime() - minDate.getTime();
      const elapsedMs = today.getTime() - minDate.getTime();
      return (elapsedMs / totalMs) * 100;
    };
    const todayLeft = getTodayPosition();

    const getTaskBarStyle = (task: any) => {
      const start = new Date(task.startDate).getTime();
      const end = new Date(task.endDate).getTime();
      const min = minDate.getTime();
      const max = maxDate.getTime();
      const left = ((start - min) / (max - min)) * 100;
      const width = ((end - start) / (max - min)) * 100;
      return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
    };

    const getTaskBarColor = (task: any) => {
      if (task.status === 'termine') return 'bg-green-500';
      if (isTaskOverdue(task)) return 'bg-red-500';
      if (task.status === 'en_cours') return 'bg-orange-500';
      return 'bg-blue-500';
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GanttChartSquare className="h-5 w-5" /> {t('ganttView')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className={`relative overflow-x-auto overflow-y-auto cursor-grab active:cursor-grabbing ${isDragging ? 'select-none' : ''}`}
              style={{ maxHeight: '600px', height: '600px' }}
              onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            >
              <div className="relative" style={{ minWidth: '1600px' }}>
                
                {/* --- LA LIGNE ROUGE VERTICALE --- */}
                {todayLeft !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-[45] pointer-events-none"
                    style={{ left: `calc(15rem + ${todayLeft}%)` }}
                  >
                    <div className="sticky top-0 bg-red-600 text-[10px] text-white px-2 font-bold py-0.5 rounded-b whitespace-nowrap">
                      AUJOURD'HUI
                    </div>
                  </div>
                )}

                <div className="flex border-b bg-muted sticky top-0 z-30">
                  <div className="w-60 p-3 font-medium border-r bg-background sticky left-0 z-40">{t('tasks')}</div>
                  <div className="flex-1 relative h-12 flex">
                    {timeUnits.map((unit, i) => (
                      <div key={i} className="flex-1 border-r text-[10px] flex items-center justify-center bg-muted/20">
                        {timeScale === 'day' ? unit.getDate() : unit.toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-0">
                  {combinedItems.map((task) => (
                    <div key={task.id} className="flex border-b hover:bg-muted/30 h-16">
                      <div className="w-60 p-3 border-r bg-background sticky left-0 z-20 truncate text-sm font-medium">
                        {task.title}
                      </div>
                      <div className="flex-1 relative p-4">
                        <div
                          className={`absolute h-8 rounded-md flex items-center px-2 text-white text-[10px] font-bold shadow-sm cursor-pointer ${getTaskBarColor(task)}`}
                          style={getTaskBarStyle(task)}
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="absolute top-0 left-0 h-full bg-white/20" style={{ width: `${task.progress}%` }} />
                          <span className="relative z-10">{task.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {selectedTask && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setSelectedTask(null)}>
              <div className="bg-background p-6 rounded-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{selectedTask.title}</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>{t('project')}:</strong> {getProjectName(selectedTask.projectId)}</p>
                  <p><strong>{t('assignedTo')}:</strong> {selectedTask.assignedTo}</p>
                  <p><strong>{t('status')}:</strong> {getStatusLabel(selectedTask.status)}</p>
                </div>
                <Button className="w-full mt-6" onClick={() => setSelectedTask(null)}>{t('close')}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('interactivePlanning')}</h1>
          <p className="text-muted-foreground">{t('planningDescription')}</p>
        </div>
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />{t('newTask')}</Button>
          </DialogTrigger>
          <DialogContent><TaskForm onSubmit={handleCreateTask} /></DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex gap-2">
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}><TableIcon className="h-4 w-4 mr-2" />{t('table')}</Button>
          <Button variant={viewMode === 'gantt' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('gantt')}><GanttChartSquare className="h-4 w-4 mr-2" />{t('gantt')}</Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={timeScale} onValueChange={(v: any) => setTimeScale(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('perDay')}</SelectItem>
              <SelectItem value="month">{t('perMonth')}</SelectItem>
              <SelectItem value="year">{t('perYear')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allProjects')}</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}><FileSpreadsheet className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
        </div>
      </div>

      {viewMode === 'table' ? renderTableView() : renderGanttView()}
    </div>
  );
};

export default PlanningNew;
