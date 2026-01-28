import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Share2, Download, AlertTriangle, Target, Activity, Zap, ShieldAlert, TrendingUp, Newspaper, Crosshair } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { fetchAnalysisDetail, AnalysisRecord } from '../lib/api';
import { cn } from '../lib/utils';

// Interfaces for rich data structure
interface Dashboard {
  core_conclusion: {
    one_sentence: string;
    signal_type: string;
    time_sensitivity: string;
    position_advice: {
      no_position: string;
      has_position: string;
    };
  };
  data_perspective: {
    trend_status: {
      ma_alignment: string;
      is_bullish: boolean;
      trend_score: number;
    };
    price_position: {
      current_price: number;
      ma5: number;
      ma10: number;
      ma20: number;
      bias_status: string;
      support_level: number;
      resistance_level: number;
    };
    volume_analysis: {
      volume_ratio: number;
      volume_status: string;
      volume_meaning: string;
    };
    chip_structure: {
      profit_ratio: number;
      avg_cost: number;
      chip_health: string;
    };
  };
  intelligence: {
    latest_news: string;
    risk_alerts: string[];
    positive_catalysts: string[];
    earnings_outlook: string;
    sentiment_summary: string;
  };
  battle_plan: {
    sniper_points: {
      ideal_buy: string;
      secondary_buy: string;
      stop_loss: string;
      take_profit: string;
    };
    position_strategy: {
      suggested_position: string;
      entry_plan: string;
      risk_control: string;
    };
    action_checklist: string[];
  };
}

interface AIResult {
  code: string;
  name: string;
  sentiment_score: number;
  trend_prediction: string;
  operation_advice: string;
  confidence_level: string;
  dashboard: Dashboard;
  trend_analysis: string;
  short_term_outlook: string;
  medium_term_outlook: string;
  technical_analysis: string;
  ma_analysis: string;
  volume_analysis: string;
  pattern_analysis: string;
  fundamental_analysis: string;
  sector_position: string;
  company_highlights: string;
  news_summary: string;
  market_sentiment: string;
  hot_topics: string;
  analysis_summary: string;
  key_points: string;
  risk_warning: string;
  buy_reason: string;
}

export default function AnalysisDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  useEffect(() => {
    if (taskId) {
      loadData(taskId);
    }
  }, [taskId]);

  const loadData = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchAnalysisDetail(id);
      setRecord(data);
      if (data.quant_data) {
        try {
          const parsed = JSON.parse(data.quant_data);
          // Check if it has nested ai_result (new format)
          if (parsed.ai_result) {
            setAiResult(parsed.ai_result);
          } else {
            // Fallback for older format if needed, or just use what we can
            console.warn("Using old format or missing ai_result");
          }
        } catch (e) {
          console.error("Failed to parse quant data", e);
        }
      }
    } catch (e) {
      console.error("Failed to load detail", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4 max-w-7xl mx-auto">
        <div className="h-8 w-1/3 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle size={48} className="mb-4" />
        <p>未找到分析记录</p>
        <Button variant="link" onClick={() => navigate('/gallery')}>返回画廊</Button>
      </div>
    );
  }

  const dashboard = aiResult?.dashboard;

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in animate-in duration-500 pb-20 px-4 sm:px-6">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 pl-0 hover:bg-transparent hover:text-primary">
          <ArrowLeft size={16} /> 返回列表
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 size={14} /> 分享
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={14} /> 导出报告
          </Button>
        </div>
      </div>

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {record.code} {aiResult?.name || ''}
            <Badge variant="secondary" className="text-sm font-normal">
              {record.date}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">AI 深度投研报告</p>
        </div>
        
        {/* Sentiment Score Card */}
        <div className={cn(
          "flex items-center gap-4 px-6 py-3 rounded-xl border-2 shadow-sm bg-background",
          record.sentiment_score >= 60 ? "border-green-100" : 
          record.sentiment_score <= 40 ? "border-red-100" :
          "border-yellow-100"
        )}>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase font-semibold">综合评分</div>
            <div className={cn(
              "text-3xl font-bold",
              record.sentiment_score >= 60 ? "text-green-600" : 
              record.sentiment_score <= 40 ? "text-red-600" :
              "text-yellow-600"
            )}>
              {record.sentiment_score}
            </div>
          </div>
          <div className={cn(
            "h-12 w-1 rounded-full",
             record.sentiment_score >= 60 ? "bg-green-500" : 
             record.sentiment_score <= 40 ? "bg-red-500" :
             "bg-yellow-500"
          )} />
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">趋势预测</div>
            <div className="font-bold">{aiResult?.trend_prediction || record.trend_status}</div>
          </div>
        </div>
      </div>

      {/* 2. Core Conclusion (Dashboard) */}
      {dashboard?.core_conclusion && (
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-background to-muted/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="text-primary" size={20} /> 核心结论
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant={dashboard.core_conclusion.signal_type.includes('卖出') ? 'destructive' : 'default'} className="text-sm">
                  {dashboard.core_conclusion.signal_type}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {dashboard.core_conclusion.time_sensitivity}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium mb-4 text-foreground/90">
              {dashboard.core_conclusion.one_sentence}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/50 p-4 rounded-lg border">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">空仓者建议</span>
                <p className="text-sm">{dashboard.core_conclusion.position_advice.no_position}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase block mb-1">持仓者建议</span>
                <p className="text-sm">{dashboard.core_conclusion.position_advice.has_position}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data & Battle Plan */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Battle Plan */}
          {dashboard?.battle_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crosshair size={20} className="text-blue-500" /> 作战计划
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sniper Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50/50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900/50">
                    <div className="text-xs text-green-600 font-bold uppercase mb-1">最佳买点</div>
                    <div className="text-sm font-medium">{dashboard.battle_plan.sniper_points.ideal_buy}</div>
                  </div>
                  <div className="bg-red-50/50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                    <div className="text-xs text-red-600 font-bold uppercase mb-1">止损位</div>
                    <div className="text-sm font-medium">{dashboard.battle_plan.sniper_points.stop_loss}</div>
                  </div>
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <div className="text-xs text-blue-600 font-bold uppercase mb-1">观察位</div>
                    <div className="text-sm font-medium">{dashboard.battle_plan.sniper_points.secondary_buy}</div>
                  </div>
                  <div className="bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50">
                    <div className="text-xs text-orange-600 font-bold uppercase mb-1">止盈/压力位</div>
                    <div className="text-sm font-medium">{dashboard.battle_plan.sniper_points.take_profit}</div>
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">行动检查清单</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {dashboard.battle_plan.action_checklist.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm bg-muted/30 p-2 rounded">
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Analysis Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-12">
                  <TabsTrigger value="summary" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12 px-6">综合分析</TabsTrigger>
                  <TabsTrigger value="technical" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12 px-6">技术面</TabsTrigger>
                  <TabsTrigger value="fundamental" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12 px-6">基本面</TabsTrigger>
                  <TabsTrigger value="news" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-12 px-6">消息面</TabsTrigger>
                </TabsList>
                
                <div className="p-6">
                  <TabsContent value="summary" className="mt-0 space-y-4">
                    <div className="prose max-w-none text-sm dark:prose-invert">
                      <ReactMarkdown>{aiResult?.analysis_summary || record.analysis_summary}</ReactMarkdown>
                    </div>
                    {aiResult?.risk_warning && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                        <h4 className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-2">
                          <ShieldAlert size={16} /> 风险提示
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-300">{aiResult.risk_warning}</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="technical" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground uppercase block">走势形态</span>
                        <span className="text-sm font-medium">{aiResult?.trend_analysis}</span>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg">
                         <span className="text-xs text-muted-foreground uppercase block">均线分析</span>
                         <span className="text-sm font-medium">{aiResult?.ma_analysis}</span>
                      </div>
                    </div>
                    <div className="prose max-w-none text-sm dark:prose-invert">
                      <h4 className="text-sm font-bold">详细技术分析</h4>
                      <ReactMarkdown>{aiResult?.technical_analysis || ''}</ReactMarkdown>
                    </div>
                  </TabsContent>

                  <TabsContent value="fundamental" className="mt-0 space-y-4">
                     <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <span className="text-xs text-muted-foreground uppercase block">板块地位</span>
                        <span className="text-sm font-medium">{aiResult?.sector_position}</span>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg">
                         <span className="text-xs text-muted-foreground uppercase block">公司亮点</span>
                         <span className="text-sm font-medium">{aiResult?.company_highlights}</span>
                      </div>
                    </div>
                    <div className="prose max-w-none text-sm dark:prose-invert">
                       <h4 className="text-sm font-bold">详细基本面分析</h4>
                      <ReactMarkdown>{aiResult?.fundamental_analysis || ''}</ReactMarkdown>
                    </div>
                  </TabsContent>

                  <TabsContent value="news" className="mt-0 space-y-4">
                    {dashboard?.intelligence && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                          <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">最新消息</h4>
                          <p className="text-sm">{dashboard.intelligence.latest_news}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">利好因素</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {dashboard.intelligence.positive_catalysts.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                              {dashboard.intelligence.positive_catalysts.length === 0 && <li className="text-muted-foreground">暂无显著利好</li>}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">风险警示</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {dashboard.intelligence.risk_alerts.map((item, i) => (
                                <li key={i} className="text-red-600 dark:text-red-400">{item}</li>
                              ))}
                              {dashboard.intelligence.risk_alerts.length === 0 && <li className="text-muted-foreground">暂无显著风险</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Data Perspective & Meta */}
        <div className="space-y-6">
          {/* Data Perspective */}
          {dashboard?.data_perspective && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity size={18} /> 数据透视
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Trend */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">趋势状态</div>
                  <div className="bg-muted/50 p-2 rounded text-sm">
                    <div className="font-medium">{dashboard.data_perspective.trend_status.ma_alignment}</div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>趋势评分</span>
                      <span className="font-mono">{dashboard.data_perspective.trend_status.trend_score}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />

                {/* Price */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">价格位置</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span>现价</span> <span className="font-mono font-bold">{dashboard.data_perspective.price_position.current_price}</span></div>
                    <div className="flex justify-between"><span>MA5</span> <span className="font-mono">{dashboard.data_perspective.price_position.ma5}</span></div>
                    <div className="flex justify-between"><span>支撑位</span> <span className="font-mono text-green-600">{dashboard.data_perspective.price_position.support_level}</span></div>
                    <div className="flex justify-between"><span>压力位</span> <span className="font-mono text-red-600">{dashboard.data_perspective.price_position.resistance_level}</span></div>
                  </div>
                  <div className="mt-2 text-xs bg-muted/50 px-2 py-1 rounded inline-block">
                    乖离状态: {dashboard.data_perspective.price_position.bias_status}
                  </div>
                </div>

                <Separator />

                {/* Volume */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">量能分析</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>量比</span>
                      <Badge variant="outline">{dashboard.data_perspective.volume_analysis.volume_ratio}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      {dashboard.data_perspective.volume_analysis.volume_meaning}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Chips */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">筹码结构</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between"><span>获利盘</span> <span className="font-mono">{dashboard.data_perspective.chip_structure.profit_ratio}%</span></div>
                    <div className="flex justify-between"><span>集中度</span> <span className="font-mono">{dashboard.data_perspective.chip_structure.concentration}%</span></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                     <span>筹码健康度</span>
                     <Badge variant={dashboard.data_perspective.chip_structure.chip_health.includes('警惕') ? 'destructive' : 'outline'}>
                       {dashboard.data_perspective.chip_structure.chip_health}
                     </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">AI 分析元数据</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>置信度</span>
                <span className="text-foreground">{aiResult?.confidence_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>联网搜索</span>
                <span className="text-foreground">{aiResult?.search_performed ? '已启用' : '未启用'}</span>
              </div>
              <div className="flex justify-between">
                <span>生成时间</span>
                <span className="text-foreground">{new Date(record.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}