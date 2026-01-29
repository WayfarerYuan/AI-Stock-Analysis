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
    <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 py-4 md:py-6 fade-in animate-in duration-500 shrink-0">
      
      {/* Hero Section */}
      <div className="text-center space-y-2 max-w-full px-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <Sparkles size={12} className="mr-1" />
          由 Gemini Pro 驱动
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight">
          智能股票分析
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
          AI 驱动的深度洞察。趋势预测、筹码分布及全方位市场情报。
        </p>
      </div>

      {/* Search Box */}
      <div className="w-full max-w-lg space-y-2 px-2">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="输入股票代码" 
              className="pl-9 h-10 text-base shadow-sm"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="h-10 sm:px-6 shadow-sm whitespace-nowrap" disabled={loading}>
            {loading ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">提交中...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              '开始分析'
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            支持多个代码，逗号分隔
          </p>
        </div>
      </div>
    </div>
  );
}

