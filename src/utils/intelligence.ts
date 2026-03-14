export interface DecodedAnalysis {
  what: string;
  impact: string;
  focus: string[];
}

/**
 * 解析从后端 snippet 中提取的 AI 分析内容
 * 后端格式通常为：【AI分析】\n这是什么？...\n有什么影响？...\n关注要点：\n1. ...
 */
export function parseAIAnalysis(snippet: string): DecodedAnalysis | null {
  if (!snippet || !snippet.includes('【AI分析】')) return null;

  const parts = snippet.split(/\n|\r\n/);
  let what = '', impact = '';
  const focus: string[] = [];
  let currentSection = '';

  for (const line of parts) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.includes('这是什么？')) {
      currentSection = 'what';
      what = trimmedLine.replace(/.*这是什么？/, '').trim();
    } else if (trimmedLine.includes('有什么影响？')) {
      currentSection = 'impact';
      impact = trimmedLine.replace(/.*有什么影响？/, '').trim();
    } else if (trimmedLine.includes('关注要点：')) {
      currentSection = 'focus';
    } else if (currentSection === 'focus' && trimmedLine.match(/^\d+\./)) {
      focus.push(trimmedLine.replace(/^\d+\./, '').trim());
    } else if (currentSection === 'what' && !trimmedLine.includes('【AI分析】')) {
      what += (what ? ' ' : '') + trimmedLine;
    } else if (currentSection === 'impact') {
      impact += (impact ? ' ' : '') + trimmedLine;
    }
  }

  return what ? { what, impact, focus } : null;
}

/**
 * 获取基于创建时间的鲜度勋章配置
 */
export function getFreshnessBadge(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffHours < 6) {
    return { text: '🔥 绝密速递', color: 'text-red-400', badge: 'bg-red-500/20 border-red-500/30' };
  }
  if (diffHours < 24) {
    return { text: '⚡ 今日重点', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' };
  }
  if (diffHours < 72) {
    return { text: '📌 行业热点', color: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30' };
  }
  return { text: '⏳ 存档情报', color: 'text-gray-500', badge: 'bg-gray-800/50 border-gray-700' };
}

/**
 * 格式化相对时间显示
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/**
 * 验证并清洗 URL
 */
export function isValidUrl(url?: string): boolean {
  if (!url || url === '' || url.includes('example.com')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成每日战略合成简报 (Mock 逻辑，预留 AI 接口)
 */
export async function generateDailySynthesis(intelData: any[]): Promise<string> {
  const highValueItems = intelData
    .filter(item => item.importance === 'high' || (item.quality_score && item.quality_score >= 8.5))
    .slice(0, 5);

  if (highValueItems.length === 0) {
    return "系统正在持续监测全球智能化动态，暂无高权重战略冲突。建议关注 2026 GTC 预热节奏。";
  }

  // 这里未来可以调用真实的 AI 接口，目前基于高价值数据做简单的模板推断
  const topics = highValueItems.map(item => {
    const title = item.title.replace(/\[.*?\]/g, '').trim();
    return `【${title.slice(0, 15)}...】`;
  }).join('、');

  return `过去 48 小时，行业核心焦点集中在 ${topics} 等代际突破。AI 研判显示，智驾竞争正从算法堆叠向“世界模型”深度感知转型，建议产品规划部重点复盘相关技术栈的 S-Curve 节点，确保我司璇玑架构的算力储备领先优势。`;
}

/**
 * 导出报告为 Markdown 格式
 */
export function generateMarkdownReport(items: any[]): string {
  const date = new Date().toLocaleDateString('zh-CN');
  let md = `# 比亚迪战略情报周报 (${date})\n\n`;
  md += `> 本报告由 Auto-Intel AI 引擎自动生成，聚焦 2026 行业关键代际突破。\n\n`;

  md += `## 一、 核心战略精要\n\n`;
  items.slice(0, 10).forEach((item, idx) => {
    const analysis = parseAIAnalysis(item.content);
    md += `### ${idx + 1}. ${item.title}\n`;
    md += `- **来源**: ${item.source}\n`;
    if (analysis) {
      md += `- **核心本质**: ${analysis.what}\n`;
      md += `- **战略影响**: ${analysis.impact}\n`;
    } else {
      md += `- **摘要**: ${item.content}\n`;
    }
    md += `- **原文链接**: [点击查看](${item.source_url})\n\n`;
  });

  md += `\n---\n*BYD Intelligence Data Center • Confidential*`;
  return md;
}
