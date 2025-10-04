/**
 * 文章相关 API
 */
import { API_CONFIG, useApi } from '~/config/api'
import type {
  ArticleDetailResponse,
  ArticleListItem,
  ArchiveSummary,
  PaginatedResponse,
} from '~/types/api'

/**
 * 获取文章列表
 */
export function useArticles(params?: {
  page?: number
  pageSize?: number
  category?: string
  tag?: string
  year?: number
  month?: number
}) {
  const query = computed(() => {
    const q: Record<string, any> = {
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    }
    if (params?.category)
      q.category = params.category
    if (params?.tag)
      q.tag = params.tag
    if (params?.year)
      q.year = params.year
    if (params?.month)
      q.month = params.month
    return q
  })

  return useApi<PaginatedResponse<ArticleListItem>>(
    API_CONFIG.endpoints.articles,
    { query: query.value },
  )
}

/**
 * 获取文章详情
 */
export function useArticleDetail(id: MaybeRef<string>) {
  const articleId = computed(() => unref(id))

  return useApi<ArticleDetailResponse>(
    computed(() => API_CONFIG.endpoints.articleDetail(articleId.value)),
    {
      key: computed(() => `article-${articleId.value}`),
    },
  )
}

/**
 * 获取首页推荐文章
 */
export function useHomeArticles() {
  return useApi<ArticleListItem[]>(API_CONFIG.endpoints.articlesHome)
}

/**
 * 获取文章归档摘要
 */
export function useArticlesArchives() {
  return useApi<ArchiveSummary[]>(API_CONFIG.endpoints.articlesArchives)
}

/**
 * 获取随机文章
 */
export function useRandomArticle() {
  return useApi<ArticleListItem>(API_CONFIG.endpoints.articlesRandom)
}
