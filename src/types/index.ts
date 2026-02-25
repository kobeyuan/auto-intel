// 产品类型
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'autonomous-driving' | 'smart-cockpit';
  description: string;
  createdAt: Date;
}

// 舆情类型
export interface Sentiment {
  id: string;
  productId: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  publishedAt: Date;
  createdAt: Date;
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
