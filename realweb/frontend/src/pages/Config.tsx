import { useEffect, useState, FormEvent } from 'react';
import { fetchStockList, addStock, removeStock } from '../lib/api';
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
    <div className="space-y-3 md:space-y-4">
      <div className="shrink-0">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">监控配置</h2>
        <p className="text-muted-foreground text-sm mt-0.5">管理每日自动分析的股票池</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Alert */}
        <div className="bg-blue-50 border-blue-200 text-blue-800 p-3 rounded-lg flex items-start gap-2 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">每日定时任务</p>
            <p className="mt-0.5 opacity-90">此列表中的股票将在每个交易日结束后自动触发分析</p>
          </div>
        </div>

        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          {/* Add Stock Form */}
          <form onSubmit={handleAdd} className="flex gap-2 p-3 border-b">
            <Input
              type="text"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="股票代码"
              className="flex-1 h-9 text-sm"
            />
            <Button type="submit" disabled={loading} size="sm" className="h-9 gap-1">
              <Plus size={14} />
              <span className="hidden sm:inline">添加</span>
            </Button>
          </form>

          {/* Stock List */}
          <div className="divide-y max-h-[40vh] md:max-h-none overflow-y-auto">
            {stocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                暂无配置股票
              </div>
            ) : (
              stocks.map((code) => (
                <div key={code} className="flex items-center justify-between p-2.5 md:p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary shrink-0">
                      <Tag size={12} />
                    </div>
                    <span className="font-mono font-medium text-sm truncate">{code}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemove(code)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 bg-muted/30 text-xs text-muted-foreground text-center border-t">
            共 {stocks.length} 只股票
          </div>
        </div>
      </div>
    </div>
  );
}
