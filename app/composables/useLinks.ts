/**
 * 友链相关 API
 * 注意: /public/links 返回的是数组 LinkDTO[]，不是分页对象
 *      /public/link-categories 返回的是数组 LinkCategoryDTO[]
 */
import { API_CONFIG, useApi } from '~/config/api'
import type { LinkCategoryDTO, LinkDTO } from '~/types/api'

/**
 * 获取友链列表
 * API 返回: { code: 200, data: LinkDTO[] } - 直接返回数组
 */
export function useLinks() {
  return useApi<LinkDTO[]>(API_CONFIG.endpoints.links)
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


