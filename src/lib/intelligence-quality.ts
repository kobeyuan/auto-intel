/**
 * 情报质量评估系统
 * 解决时效性、准确性、消息源可靠性问题
 */

// 消息源可信度评级
export type SourceCredibility = 'tier1' | 'tier2' | 'tier3' | 'unverified';

export interface SourceReliability {
  domain: string;
  tier: SourceCredibility;
  score: number; // 0-100
  description: string;
  verifyMethod: string[];
}

// Tier 1: 官方/权威媒体（最可靠）
export const TIER1_SOURCES: SourceReliability[] = [
  { domain: 'tesla.com', tier: 'tier1', score: 95, description: 'Tesla 官方', verifyMethod: ['official', 'primary_source'] },
  { domain: 'huawei.com', tier: 'tier1', score: 95, description: '华为官方', verifyMethod: ['official', 'primary_source'] },
  { domain: 'nio.com', tier: 'tier1', score: 95, description: '蔚来官方', verifyMethod: ['official', 'primary_source'] },
  { domain: 'xiaomi.com', tier: 'tier1', score: 95, description: '小米官方', verifyMethod: ['official', 'primary_source'] },
  { domain: 'xpeng.com', tier: 'tier1', score: 95, description: '小鹏官方', verifyMethod: ['official', 'primary_source'] },
  { domain: 'lixiang.com', tier: 'tier1', score: 95, description: '理想官方', verifyMethod: ['official', 'primary_source'] },
  { domain: 'byd.com', tier: 'tier1', score: 95, description: '比亚迪官方', verifyMethod: ['official', 'primary_source'] },
  { domain: 'weibo.com', tier: 'tier1', score: 90, description: '官方微博', verifyMethod: ['verified_account', 'official'] },
  { domain: 'x.com', tier: 'tier1', score: 90, description: 'X/Twitter 官方账号', verifyMethod: ['verified_account', 'official'] },
];

// Tier 2: 权威科技/汽车媒体（可靠）
export const TIER2_SOURCES: SourceReliability[] = [
  { domain: '36kr.com', tier: 'tier2', score: 85, description: '36氪', verifyMethod: ['professional_media', 'editorial_review'] },
  { domain: 'pingwest.com', tier: 'tier2', score: 85, description: '品玩', verifyMethod: ['professional_media', 'editorial_review'] },
  { domain: 'geekpark.net', tier: 'tier2', score: 85, description: '极客公园', verifyMethod: ['professional_media', 'editorial_review'] },
  { domain: 'autohome.com.cn', tier: 'tier2', score: 80, description: '汽车之家', verifyMethod: ['professional_media', 'industry_recognition'] },
  { domain: 'pcauto.com.cn', tier: 'tier2', score: 80, description: '太平洋汽车', verifyMethod: ['professional_media', 'industry_recognition'] },
  { domain: 'yiche.com', tier: 'tier2', score: 80, description: '易车', verifyMethod: ['professional_media', 'industry_recognition'] },
  { domain: 'cnevpost.com', tier: 'tier2', score: 85, description: 'CnEVPost', verifyMethod: ['professional_media', 'industry_focus'] },
  { domain: 'electrek.co', tier: 'tier2', score: 85, description: 'Electrek', verifyMethod: ['professional_media', 'industry_focus'] },
  { domain: 'insideevs.com', tier: 'tier2', score: 85, description: 'InsideEVs', verifyMethod: ['professional_media', 'industry_focus'] },
  { domain: 'techcrunch.com', tier: 'tier2', score: 85, description: 'TechCrunch', verifyMethod: ['professional_media', 'global_recognition'] },
  { domain: 'theverge.com', tier: 'tier2', score: 85, description: 'The Verge', verifyMethod: ['professional_media', 'global_recognition'] },
];

// Tier 3: 一般媒体/自媒体（需验证）
export const TIER3_SOURCES: SourceReliability[] = [
  { domain: 'zhihu.com', tier: 'tier3', score: 60, description: '知乎', verifyMethod: ['community', 'user_generated'] },
  { domain: 'bilibili.com', tier: 'tier3', score: 55, description: 'B站', verifyMethod: ['community', 'user_generated'] },
  { domain: 'youtube.com', tier: 'tier3', score: 60, description: 'YouTube', verifyMethod: ['community', 'user_generated'] },
  { domain: 'medium.com', tier: 'tier3', score: 65, description: 'Medium', verifyMethod: ['blog', 'individual'] },
];

/**
 * 评估消息源可信度
 */
export function assessSourceCredibility(url: string): SourceReliability {
  const domain = extractDomain(url);

  // 查找匹配的来源
  const allSources = [...TIER1_SOURCES, ...TIER2_SOURCES, ...TIER3_SOURCES];
  const matched = allSources.find(s => domain.includes(s.domain));

  if (matched) {
    return matched;
  }

  // 默认未验证
  return {
    domain,
    tier: 'unverified',
    score: 30,
    description: '未验证来源',
    verifyMethod: ['manual_review_needed']
  };
}

/**
 * 提取域名
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * 计算情报时效性分数
 */
export function calculateFreshnessScore(publishedAt: string | null): {
  score: number;
  level: 'hot' | 'fresh' | 'normal' | 'stale';
  hoursAgo: number;
} {
  if (!publishedAt) {
    return { score: 50, level: 'normal', hoursAgo: -1 };
  }

  const publishDate = new Date(publishedAt);
  const now = new Date();
  const hoursAgo = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 1) {
    return { score: 100, level: 'hot', hoursAgo };
  } else if (hoursAgo < 6) {
    return { score: 90, level: 'fresh', hoursAgo };
  } else if (hoursAgo < 24) {
    return { score: 80, level: 'fresh', hoursAgo };
  } else if (hoursAgo < 72) {
    return { score: 60, level: 'normal', hoursAgo };
  } else {
    return { score: 30, level: 'stale', hoursAgo };
  }
}

/**
 * 验证情报准确性（通过交叉验证）
 */
export interface VerificationResult {
  isVerified: boolean;
  confidence: number; // 0-100
  crossReferences: string[];
  warnings: string[];
}

export function verifyAccuracy(
  title: string,
  source: string,
  similarItems: Array<{ title: string; source: string; link: string }>
): VerificationResult {
  const result: VerificationResult = {
    isVerified: false,
    confidence: 0,
    crossReferences: [],
    warnings: []
  };

  const sourceCred = assessSourceCredibility(source);

  // 1. 基于来源可信度评分
  result.confidence += sourceCred.score * 0.4;

  // 2. 查找交叉验证
  const keyTerms = extractKeyTerms(title);
  const crossVerified = similarItems.filter(item => {
    if (item.source === source) return false; // 排除同一来源
    const itemTerms = extractKeyTerms(item.title);
    const overlap = keyTerms.filter(t => itemTerms.includes(t)).length;
    return overlap >= 2; // 至少有2个关键词重叠
  });

  if (crossVerified.length > 0) {
    result.crossReferences = crossVerified.map(v => v.link);
    result.confidence += Math.min(crossVerified.length * 15, 40);

    // 检查交叉来源的可信度
    const hasTier1 = crossVerified.some(v => assessSourceCredibility(v.source).tier === 'tier1');
    if (hasTier1) {
      result.confidence += 10;
    }
  } else {
    result.warnings.push('缺乏交叉验证，信息可能不准确');
  }

  // 3. 根据最终置信度判断是否验证通过
  result.isVerified = result.confidence >= 70;

  if (result.confidence < 50) {
    result.warnings.push('可信度较低，建议人工核实');
  }

  result.confidence = Math.min(result.confidence, 100);

  return result;
}

/**
 * 提取关键词
 */
function extractKeyTerms(title: string): string[] {
  const commonTerms = [
    'Tesla', 'FSD', '华为', '问界', 'ADS', '蔚来', 'NIO', '小鹏', 'XPeng',
    '理想', 'Li Auto', '小米', 'Xiaomi', 'SU7', '比亚迪', 'BYD',
    'OTA', '智驾', '自动驾驶', '智能座舱', '芯片', '激光雷达',
    '端到端', '城市NOA', '高速NOA', '推送', '发布'
  ];

  return commonTerms.filter(term => title.toLowerCase().includes(term.toLowerCase()));
}

/**
 * 综合质量评分
 */
export interface QualityScore {
  overall: number;
  freshness: number;
  credibility: number;
  accuracy: number;
  verdict: 'high_quality' | 'medium_quality' | 'low_quality' | 'suspicious';
}

export function calculateOverallQuality(
  publishedAt: string | null,
  source: string,
  similarItems: Array<{ title: string; source: string; link: string }>
): QualityScore {
  const freshness = calculateFreshnessScore(publishedAt);
  const credibility = assessSourceCredibility(source);
  const accuracy = verifyAccuracy(source, source, similarItems);

  const freshnessWeight = 0.3;
  const credibilityWeight = 0.4;
  const accuracyWeight = 0.3;

  const overall = Math.round(
    freshness.score * freshnessWeight +
    credibility.score * credibilityWeight +
    accuracy.confidence * accuracyWeight
  );

  let verdict: QualityScore['verdict'];
  if (overall >= 80 && accuracy.isVerified) {
    verdict = 'high_quality';
  } else if (overall >= 60) {
    verdict = 'medium_quality';
  } else if (overall >= 40) {
    verdict = 'low_quality';
  } else {
    verdict = 'suspicious';
  }

  return {
    overall,
    freshness: freshness.score,
    credibility: credibility.score,
    accuracy: accuracy.confidence,
    verdict
  };
}

/**
 * 生成质量徽章
 */
export function generateQualityBadge(quality: QualityScore): {
  text: string;
  color: string;
  icon: string;
} {
  switch (quality.verdict) {
    case 'high_quality':
      return { text: '高可信度', color: '#10b981', icon: '✓' };
    case 'medium_quality':
      return { text: '中等可信度', color: '#f59e0b', icon: '!' };
    case 'low_quality':
      return { text: '低可信度', color: '#ef4444', icon: '?' };
    case 'suspicious':
      return { text: '可疑', color: '#7f1d1d', icon: '✗' };
  }
}
