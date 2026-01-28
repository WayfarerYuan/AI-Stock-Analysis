import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, XCircle, Clock, ArrowRight, RefreshCw, TrendingUp, TrendingDown, Search, ChevronLeft, ChevronRight, Settings2, MoreHorizontal } from 'lucide-react';
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
    <div className="space-y-4 h-full flex flex-col pb-0">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">任务列表</h2>
                <p className="text-muted-foreground mt-1">查看所有分析任务的状态与结果。</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-2">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 
                  刷新
                </Button>
            </div>
        </div>

        {/* Toolbar */}
        <div className="bg-card border rounded-lg p-2 flex flex-col md:flex-row gap-2 items-center justify-between shadow-sm">
           <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索代码、名称..." 
                className="pl-9 h-9 bg-background" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                <Settings2 size={14} />
                <span className="hidden sm:inline">自动刷新:</span>
              </div>
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger className="w-[90px] h-9">
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
          <Table>
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
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between shrink-0 py-2">
         <div className="text-sm text-muted-foreground">
           {historyTotal === 0 ? '暂无历史记录' : `显示第 ${(page - 1) * pageSize + 1} 到 ${Math.min(page * pageSize, historyTotal)} 条，共 ${historyTotal} 条历史记录`}
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
             <ChevronLeft size={14} className="mr-1" /> 上一页
           </Button>
           <div className="text-sm text-muted-foreground">
             第 {page} / {Math.ceil(historyTotal / pageSize) || 1} 页
           </div>
           <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(historyTotal / pageSize)}>
             下一页 <ChevronRight size={14} className="ml-1" />
           </Button>
         </div>
      </div>
    </div>
  );
}
