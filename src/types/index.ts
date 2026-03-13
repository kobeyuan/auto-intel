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

// 行业新闻/情报核心类型
export interface IndustryNews {
  id: string;
  title: string;
  content: string; // 对应数据库的 snippet
  source: string;
  source_url: string; // 对应数据库的 link
  category: string;
  keywords?: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 'high' | 'medium' | 'low';
  quality_score?: number;
  verified?: boolean;
  metadata?: {
    tags?: string[];
    ai_analysis?: {
      what?: string;
      impact?: string;
      focus?: string[];
    };
    [key: string]: any;
  };
  published_at: string | Date;
  created_at: string | Date;
}

// 兼容旧命名的别名 (逐步废弃)
export type IntelligenceItem = IndustryNews;

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
