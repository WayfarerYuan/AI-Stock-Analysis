import { useState, FormEvent } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { submitAnalysis } from '../lib/api';

export default function Dashboard() {
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || loading) return;
    
    setLoading(true);
    try {
      // Support multiple codes separated by comma
      const codes = inputCode.split(',').map(c => c.trim()).filter(c => c);
      
      for (const code of codes) {
        await submitAnalysis(code, 'simple', false);
      }
      
      // Trigger refresh in Tasks component
      window.dispatchEvent(new Event('refresh-tasks'));
      
      // Scroll to tasks section if available
      const tasksSection = document.getElementById('tasks-section');
      if (tasksSection) {
        tasksSection.scrollIntoView({ behavior: 'smooth' });
      }
      
      setInputCode('');
    } catch (error) {
      console.error('Failed to submit analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-6 fade-in animate-in duration-500 shrink-0">
      
      {/* Hero Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <Sparkles size={12} className="mr-1" />
          由 Gemini Pro 驱动
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
          智能股票分析
        </h1>
        <p className="text-lg text-muted-foreground">
          AI 驱动的深度洞察。趋势预测、筹码分布及全方位市场情报。
        </p>
      </div>

      {/* Search Box */}
      <div className="w-full max-w-lg space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="输入股票代码 (如 600519, 000001)" 
              className="pl-9 h-10 text-base shadow-sm"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="h-10 px-6 shadow-sm" disabled={loading}>
            {loading ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              '开始分析'
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            支持输入多个代码，以逗号分隔
          </p>
        </div>
      </div>
    </div>
  );
}

