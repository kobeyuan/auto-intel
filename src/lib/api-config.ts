/**
 * API 配置
 * Cloudflare Pages 前端调用 Vercel API
 */

// Vercel API 基础地址
export const VERCEL_API_BASE = process.env.NEXT_PUBLIC_VERCEL_API_URL || 'https://auto-intel-g21ysjcud-kobeyuans-projects.vercel.app';

// API 端点
export const API_ENDPOINTS = {
  // 情报采集
  collect: `${VERCEL_API_BASE}/api/update_intel`,
  // RSS 采集
  rssCollect: `${VERCEL_API_BASE}/api/rss_collect`,
  // 健康检查
  health: `${VERCEL_API_BASE}/api/health`,
};

/**
 * 触发情报采集
 */
export async function collectIntelligence() {
  try {
    const response = await fetch(API_ENDPOINTS.collect, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('采集失败:', error);
    throw error;
  }
}

/**
 * 触发 RSS 采集
 */
export async function collectRSS() {
  try {
    const response = await fetch(API_ENDPOINTS.rssCollect, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('RSS 采集失败:', error);
    throw error;
  }
}

/**
 * 检查 API 健康状态
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(API_ENDPOINTS.health, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('健康检查失败:', error);
    return { status: 'unhealthy', error: String(error) };
  }
}
