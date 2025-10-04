/**
 * API 配置和基础封装
 */
import type { UseFetchOptions } from 'nuxt/app'
import type { ApiResponse } from '~/types/api'

export const API_CONFIG = {
  // 开发环境使用本地 API
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost:8091'
    : process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8091',

  // API 超时时间
  timeout: 10000,

  // API 端点（需要 /api 前缀）
  endpoints: {
    // 文章相关
    articles: '/api/public/articles',
    articleDetail: (id: string) => `/api/public/articles/${id}`,
    articlesHome: '/api/public/articles/home',
    articlesArchives: '/api/public/articles/archives',
    articlesRandom: '/api/public/articles/random',

    // 友链相关
    links: '/api/public/links',
    linkCategories: '/api/public/link-categories',
    linksRandom: '/api/public/links/random',

    // 评论相关
    comments: '/api/public/comments',
    commentsLatest: '/api/public/comments/latest',

    // 站点配置
    siteConfig: '/api/public/site-config',

    // 统计相关
    statisticsBasic: '/api/public/statistics/basic',

    // 页面相关
    page: (path: string) => `/api/public/pages/${path}`,

    // 搜索
    search: '/api/public/search',

    // RSS 订阅
    rss: '/api/rss.xml',
    sitemap: '/api/sitemap.xml',
  },
} as const

/**
 * 创建 API 请求
 * @param url API 端点 URL
 * @param options 请求选项
 * @returns useFetch 返回值
 */
export function useApi<T>(
  url: MaybeRefOrGetter<string>,
  options?: UseFetchOptions<ApiResponse<T>>,
) {
  return useFetch<ApiResponse<T>>(toValue(url), {
    baseURL: API_CONFIG.baseURL,
    ...options,
    // 处理响应,验证状态码
    onResponse({ response }) {
      // API 使用 200 或 0 作为成功码
      if (response._data && typeof response._data === 'object') {
        const data = response._data as ApiResponse<T>
        if (data.code !== 200 && data.code !== 0) {
          console.error('API 请求失败:', data.message || '未知错误')
        }
      }
    },
    // 错误处理
    onResponseError({ response }) {
      console.error('API 响应错误:', {
        status: response.status,
        statusText: response.statusText,
        data: response._data,
      })
    },
    onRequestError({ error }) {
      console.error('API 请求错误:', error)
    },
  })
}

/**
 * 直接获取数据（自动解包 data 字段）
 * @param url API 端点 URL
 * @param options 请求选项
 * @returns 解包后的数据
 */
export async function useApiData<T>(
  url: string,
  options?: UseFetchOptions<ApiResponse<T>>,
) {
  const { data, error } = await useApi<T>(url, options)

  if (error.value) {
    console.error('useApiData 错误:', error.value)
    throw error.value
  }

  // 返回解包后的数据
  return computed(() => data.value?.data)
}

