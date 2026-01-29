import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, XCircle, Clock, ArrowRight, RefreshCw, Search, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { fetchTasks, Task, fetchHistory, AnalysisRecord } from '../lib/api';
import { cn } from '../lib/utils';

interface UnifiedTask {
  id: string;
  code: string;
  name?: string;
  status: string;
  startTime: string; // ISO string
  score?: number;
  trend?: string;
  advice?: string;
  error?: string;
}

export default function Tasks() {
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshInterval, setRefreshInterval] = useState('10'); // seconds
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const navigate = useNavigate();
  const prevTasksRef = useRef<Task[]>([]);

  useEffect(() => {
    loadAllData();
    
    // Listen for custom refresh event from Dashboard
    const handleRefreshEvent = () => {
        loadTasks(); // Only load tasks is enough as new tasks appear there
    };
    
    window.addEventListener('refresh-tasks', handleRefreshEvent);
    return () => window.removeEventListener('refresh-tasks', handleRefreshEvent);
  }, []);

  // Handle auto-refresh
  useEffect(() => {
    if (refreshInterval === 'manual') return;
    
    const ms = parseInt(refreshInterval) * 1000;
    const interval = setInterval(() => {
      // Only refresh active tasks silently
      fetchTasks().then(setActiveTasks).catch(console.error);
    }, ms);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Monitor active tasks for completion to trigger history refresh
  useEffect(() => {
    const prevTasks = prevTasksRef.current;
    const hasCompletion = activeTasks.some(current => {
      const prev = prevTasks.find(p => p.task_id === current.task_id);
      return prev && 
             (prev.status === 'running' || prev.status === 'pending') && 
             (current.status === 'completed' || current.status === 'failed');
    });
    
    if (hasCompletion) {
        // Delay slightly to ensure backend DB is consistent
        setTimeout(() => {
            loadHistory();
        }, 500);
    }
    
    prevTasksRef.current = activeTasks;
  }, [activeTasks]);

  // Effect to load history when page changes
  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadTasks(), loadHistory()]);
    setLoading(false);
  };

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setActiveTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    }
  };

  const loadHistory = async () => {
    try {
      // Calculate offset based on page
      const offset = (page - 1) * pageSize;
      const data = await fetchHistory(pageSize, offset);
      setHistory(data.items);
      setHistoryTotal(data.total);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadAllData().finally(() => setLoading(false));
  };

  // Merge and Normalize Data
  const unifiedTasks: UnifiedTask[] = [
    // Active tasks first
    ...(activeTasks?.map(t => ({
      id: t.task_id,
      code: t.code,
      name: t.result?.name,
      status: t.status,
      startTime: t.start_time,
      score: t.result?.sentiment_score,
      trend: t.result?.trend_prediction,
      advice: t.result?.operation_advice,
      error: t.error
    })) || []),
    // History records
    ...(history?.map(r => {
      let name = '';
      try {
        if (r.quant_data) {
           const q = JSON.parse(r.quant_data);
           name = q.ai_result?.name || q.name || '';
        }
      } catch {}
      return {
        id: r.task_id,
        code: r.code,
        name: name,
        status: 'completed', // History is always completed
        startTime: r.created_at,
        score: r.sentiment_score,
        trend: r.trend_status,
        advice: r.buy_signal,
      };
    }) || [])
  ];

  // Deduplicate: If a task is in both active (e.g. just finished) and history, prefer active (more recent state usually, or history is source of truth? History is source of truth for completed).
  // Actually, fetchTasks might return completed tasks for a while.
  // Let's use a Map to dedup by ID.
  const uniqueTasksMap = new Map<string, UnifiedTask>();
  unifiedTasks.forEach(t => {
      if (!uniqueTasksMap.has(t.id)) {
          uniqueTasksMap.set(t.id, t);
      }
  });
  
  const sortedTasks = Array.from(uniqueTasksMap.values())
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .filter(t => 
      t.code.includes(searchTerm) || 
      (t.name && t.name.includes(searchTerm)) ||
      t.status.includes(searchTerm)
    );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'failed': return <XCircle className="text-red-500" size={18} />;
      case 'running': return <Play className="text-blue-500 animate-pulse" size={18} />;
      default: return <Clock className="text-muted-foreground" size={18} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'running': return '进行中';
      case 'pending': return '等待中';
      default: return status;
    }
  };

  return (
    <div className="space-y-3 h-full flex flex-col pb-0">
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">任务列表</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-1">查看分析任务状态与结果</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-1 h-8 px-2 md:gap-2 md:h-9 md:px-3">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 
            <span className="hidden sm:inline">刷新</span>
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center shadow-sm">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索代码、名称..." 
              className="pl-9 h-9 bg-background text-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <Settings2 size={12} />
              <span className="hidden xs:inline">刷新:</span>
            </div>
            <Select value={refreshInterval} onValueChange={setRefreshInterval}>
              <SelectTrigger className="w-[70px] h-9">
                <SelectValue placeholder="频率" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5秒</SelectItem>
                <SelectItem value="10">10秒</SelectItem>
                <SelectItem value="30">30秒</SelectItem>
                <SelectItem value="manual">手动</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Task Table */}
      <div className="border rounded-lg bg-card shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <Table className="hidden md:table">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead>股票</TableHead>
                <TableHead className="hidden md:table-cell">开始时间</TableHead>
                <TableHead>分析结果</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    暂无任务记录
                  </TableCell>
                </TableRow>
              ) : (
                sortedTasks.map((task) => (
                <TableRow key={task.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2" title={getStatusText(task.status)}>
                       {getStatusIcon(task.status)}
                       <span className="text-sm font-medium hidden sm:inline-block text-muted-foreground">
                         {getStatusText(task.status)}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold font-mono text-base">{task.code}</span>
                      {task.name && <span className="text-xs text-muted-foreground">{task.name}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">
                    {new Date(task.startTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {task.status === 'completed' ? (
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                           <Badge variant={
                             (task.score || 0) >= 60 ? "default" : 
                             (task.score || 0) <= 40 ? "destructive" : "secondary"
                           } className="h-5 px-1.5 text-[10px]">
                             {task.score || 0}分
                           </Badge>
                           <span className={cn(
                             "text-sm font-medium",
                             task.trend?.includes("看多") ? "text-red-500" : 
                             task.trend?.includes("看空") ? "text-green-500" : "text-muted-foreground"
                           )}>
                             {task.trend}
                           </span>
                         </div>
                         <span className="text-xs text-muted-foreground">{task.advice}</span>
                      </div>
                    ) : task.status === 'running' ? (
                       <div className="w-full max-w-[140px] space-y-1">
                          <div className="text-xs text-blue-500 flex justify-between">
                            <span>分析中...</span>
                            <span className="animate-pulse">Running</span>
                          </div>
                          <Progress value={60} className="h-1.5" />
                       </div>
                    ) : task.status === 'failed' ? (
                       <span className="text-xs text-red-500 max-w-[200px] truncate block" title={task.error}>
                         {task.error || '未知错误'}
                       </span>
                    ) : (
                       <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {task.status === 'completed' && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/analysis/${task.id}`)}>
                        详情 <ArrowRight size={14} className="ml-1" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>

          <div className="md:hidden divide-y">
            {sortedTasks.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                暂无任务记录
              </div>
            ) : (
              sortedTasks.map((task) => (
                <div key={task.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(task.status)}
                      <span className="font-bold font-mono text-base truncate">{task.code}</span>
                    </div>
                    {task.status === 'completed' && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/analysis/${task.id}`)} className="h-7 px-2 text-xs">
                        详情
                      </Button>
                    )}
                  </div>
                  {task.name && <div className="text-xs text-muted-foreground">{task.name}</div>}
                  <div className="text-xs text-muted-foreground font-mono">{new Date(task.startTime).toLocaleString()}</div>
                  {task.status === 'completed' ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={
                        (task.score || 0) >= 60 ? "default" : 
                        (task.score || 0) <= 40 ? "destructive" : "secondary"
                      } className="h-5 px-1.5 text-[10px]">
                        {task.score || 0}分
                      </Badge>
                      <span className={cn(
                        "text-xs font-medium",
                        task.trend?.includes("看多") ? "text-red-500" : 
                        task.trend?.includes("看空") ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {task.trend}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{task.advice}</span>
                    </div>
                  ) : task.status === 'running' ? (
                    <div className="space-y-1">
                      <div className="text-xs text-blue-500 flex justify-between">
                        <span>分析中...</span>
                        <span className="animate-pulse">Running</span>
                      </div>
                      <Progress value={60} className="h-1" />
                    </div>
                  ) : task.status === 'failed' ? (
                    <div className="text-xs text-red-500 truncate" title={task.error}>
                      {task.error || '未知错误'}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">-</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        </div>

      <div className="flex items-center justify-between shrink-0 py-2 gap-2">
         <div className="text-xs text-muted-foreground flex-1 truncate">
           {historyTotal === 0 ? '暂无历史记录' : `共 ${historyTotal} 条记录`}
         </div>
         <div className="flex items-center gap-1">
           <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-2">
             <ChevronLeft size={14} />
           </Button>
           <div className="text-xs text-muted-foreground px-1">
             {page}/{Math.ceil(historyTotal / pageSize) || 1}
           </div>
           <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(historyTotal / pageSize)} className="h-8 px-2">
             <ChevronRight size={14} />
           </Button>
         </div>
      </div>
    </div>
  );
}
