import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Task {
  task_id: string;
  code: string;
  status: string;
  start_time: string;
  end_time?: string;
  result?: any;
  error?: string;
  report_type?: string;
}

export interface AnalysisRecord {
  task_id: string;
  code: string;
  date: string;
  created_at: string;
  sentiment_score: number;
  trend_status: string;
  buy_signal: string;
  one_line_summary: string;
  analysis_summary: string;
  quant_data: string | null; // JSON string
}

export const fetchTasks = async (limit = 50) => {
  const response = await api.get<Task[]>('/tasks', { params: { limit } });
  return response.data;
};

export const submitAnalysis = async (code: string, reportType = 'simple', enableNotify = false) => {
  const response = await api.post('/analyze', { 
    code, 
    report_type: reportType,
    enable_notify: enableNotify 
  });
  return response.data;
};

export const fetchHistory = async (limit = 50, offset = 0) => {
  const response = await api.get<{ total: number, items: AnalysisRecord[] }>('/history', { params: { limit, offset } });
  return response.data;
};

export const fetchAnalysisDetail = async (taskId: string) => {
  const response = await api.get<AnalysisRecord>(`/analysis/${taskId}`);
  return response.data;
};

export const fetchStockList = async () => {
  const response = await api.get<{ stocks: string[] }>('/config/stocks');
  return response.data.stocks;
};

export const addStock = async (code: string) => {
  const response = await api.post<{ stocks: string[] }>('/config/stocks', { code });
  return response.data.stocks;
};

export const removeStock = async (code: string) => {
  const response = await api.delete<{ stocks: string[] }>(`/config/stocks/${code}`);
  return response.data.stocks;
};
