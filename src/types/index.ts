// 产品类型
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'autonomous-driving' | 'smart-cockpit';
  description: string;
  created_at: Date;
}

// 舆情类型
export interface Sentiment {
  id: string;
  product_id: string;
  title: string;
  content: string;
  source: string;
  source_url?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  published_at: Date;
  created_at: Date;
  keywords: string[];
}

// 情感分析结果
export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keywords: string[];
  summary: string;
}

// 统计数据
export interface DashboardStats {
  totalProducts: number;
  totalSentiments: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  recentSentiments: Sentiment[];
}

// 行业新闻类型
export interface IndustryNews {
  id: string;
  title: string;
  content: string;
  source: string;
  source_url: string;
  category: 'technology' | 'product' | 'policy' | 'funding' | 'partnership' | 'other';
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 'high' | 'medium' | 'low';
  published_at: Date;
  created_at: Date;
}

// 行业新闻查询参数
export interface IndustryNewsQuery {
  category?: string;
  sentiment?: string;
  importance?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
