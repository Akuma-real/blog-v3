/**
 * 友链相关 API
 * 注意: /public/links 返回的是分页对象 { list: [...] }
 *      /public/link-categories 返回的是数组 [...]
 */
import { API_CONFIG, useApi } from '~/config/api'
import type { LinkCategoryDTO, LinkDTO, PaginatedResponse } from '~/types/api'

/**
 * 获取友链列表
 * API 返回: { code: 200, data: { list: LinkDTO[], total, page, pageSize } }
 */
export function useLinks() {
  return useApi<PaginatedResponse<LinkDTO>>(API_CONFIG.endpoints.links)
}

/**
 * 获取友链分类
 * API 返回: { code: 200, data: LinkCategoryDTO[] } - 直接返回数组
 */
export function useLinkCategories() {
  return useApi<LinkCategoryDTO[]>(API_CONFIG.endpoints.linkCategories)
}

/**
 * 获取随机友链
 * API 返回: { code: 200, data: LinkDTO[] }
 */
export function useRandomLinks(count?: number) {
  const query = count ? { count } : undefined
  return useApi<LinkDTO[]>(API_CONFIG.endpoints.linksRandom, { query })
}


