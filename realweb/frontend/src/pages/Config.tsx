import { useEffect, useState, FormEvent } from 'react';
import { fetchStockList, addStock, removeStock } from '../../lib/api';
import { Plus, Trash2, Tag, Info } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export default function Config() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [newStock, setNewStock] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    const list = await fetchStockList();
    setStocks(list);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStock) return;
    
    setLoading(true);
    try {
      const updated = await addStock(newStock.trim());
      setStocks(updated);
      setNewStock('');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (code: string) => {
    if (!confirm(`确定要从每日监控列表中移除 ${code} 吗?`)) return;
    
    setLoading(true);
    try {
      const updated = await removeStock(code);
      setStocks(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight">配置管理</h2>
        <p className="text-muted-foreground mt-1">管理每日自动分析的股票池。</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {/* Alert */}
        <div className="bg-blue-50 border-blue-200 text-blue-800 p-3 rounded-lg flex items-start gap-3 text-sm shrink-0">
          <Info className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold">每日定时任务</p>
            <p className="mt-1 opacity-90">此列表中的股票将在每个交易日结束后自动触发全量分析。</p>
          </div>
        </div>

        <Card className="flex flex-col flex-1 min-h-0 shadow-sm">
          <CardHeader className="shrink-0 py-4">
            <CardTitle className="text-lg">监控配置</CardTitle>
            <CardDescription>添加新股票或管理现有监控列表</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden pb-4">
            {/* Add Stock Form */}
            <form onSubmit={handleAdd} className="flex gap-2 shrink-0">
              <Input
                type="text"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="例如: 600519"
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="gap-2 shrink-0">
                <Plus size={16} />
                添加
              </Button>
            </form>

            <div className="border rounded-lg flex-1 min-h-0 overflow-y-auto">
              {stocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  暂无配置股票
                </div>
              ) : (
                <div className="divide-y">
                  {stocks.map((code) => (
                    <div key={code} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                          <Tag size={14} />
                        </div>
                        <span className="font-mono font-medium text-base">{code}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(code)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-right shrink-0">
               共 {stocks.length} 只股票在监控中
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
