/**
 * 友链相关 API
 * 注意：API 文档说返回数组，但实际返回的是分页对象！
 *      /public/links 实际返回: { list: LinkDTO[], total, page, pageSize }
 *      /public/link-categories 返回数组: LinkCategoryDTO[]
 */
import { API_CONFIG, useApi } from '~/config/api'
import type { LinkCategoryDTO, LinkDTO, PaginatedResponse } from '~/types/api'

/**
 * 获取友链列表
 * 实际返回: { code: 200, data: { list: LinkDTO[], total, page, pageSize } }
 * （文档不准确）
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


