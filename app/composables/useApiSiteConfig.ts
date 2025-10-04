/**
 * 站点配置和公共 API
 * 包含站点配置、统计、页面内容等功能
 */
import { API_CONFIG, useApi } from '~/config/api'
import type { VisitorStatistics, PageContent, SiteConfig } from '~/types/api'

/**
 * 获取站点配置（从 API）
 * 从 API 获取站点配置，如果失败则使用本地配置作为降级方案
 */
export function useApiSiteConfig() {
	const appConfig = useAppConfig()

	const { data: siteConfig, error } = useAsyncData(
		'site-config',
		async () => {
			try {
				const response = await $fetch<any>(
					API_CONFIG.endpoints.siteConfig,
					{ baseURL: API_CONFIG.baseURL },
				)
				// API 返回: { code: 200, data: SiteConfig }
				if (response?.code === 200 && response?.data) {
					return response.data as SiteConfig
				}
				return null
			}
			catch (error) {
				console.error('Failed to fetch site config:', error)
				return null
			}
		},
		{
			// 缓存配置
			lazy: false,
			server: true,
		},
	)

	// 获取完整的图片 URL（处理相对路径）
	const getFullUrl = (path?: string) => {
		if (!path)
			return ''
		// 如果已经是完整 URL，直接返回
		if (path.startsWith('http://') || path.startsWith('https://'))
			return path
		// 相对路径，拼接 API baseURL
		return `${API_CONFIG.baseURL}${path}`
	}

	// 返回的配置对象，优先使用 API 数据，失败时使用本地配置
	const config = computed(() => {
		const apiConfig = siteConfig.value

		// 如果 API 配置可用，使用 API 数据
		if (apiConfig) {
			return {
				// 站点标题
				title: apiConfig.APP_NAME || appConfig.title,
				// 站点副标题
				subtitle: apiConfig.SUB_TITLE || appConfig.subtitle || appConfig.header.subtitle,
				// 站点描述
				description: apiConfig.SITE_DESCRIPTION || appConfig.description,
				// 站点 URL
				url: apiConfig.SITE_URL || appConfig.url,
				// 头像/Logo
				logo: getFullUrl(apiConfig.USER_AVATAR || apiConfig.LOGO_URL) || appConfig.header.logo,
				// Favicon
				icon: getFullUrl(apiConfig.ICON_URL) || appConfig.favicon,
				// 作者信息
				author: {
					name: apiConfig.APP_NAME || appConfig.author?.name,
					avatar: getFullUrl(apiConfig.USER_AVATAR) || appConfig.author?.avatar,
					email: appConfig.author?.email,
					homepage: appConfig.author?.homepage,
				},
				// 原始 API 配置（用于其他用途）
				raw: apiConfig,
			}
		}

		// 降级到本地配置
		return {
			title: appConfig.title,
			subtitle: appConfig.subtitle || appConfig.header.subtitle,
			description: appConfig.description,
			url: appConfig.url,
			logo: appConfig.header.logo,
			icon: appConfig.favicon,
			author: {
				name: appConfig.author?.name,
				avatar: appConfig.author?.avatar,
				email: appConfig.author?.email,
				homepage: appConfig.author?.homepage,
			},
			raw: null,
		}
	})

	return {
		siteConfig: config,
		isLoading: computed(() => !siteConfig.value && !error.value),
		error,
	}
}

/**
 * 获取基础统计
 * API 返回: { code: 200, data: VisitorStatistics }
 */
export function useBasicStats() {
  return useApi<VisitorStatistics>(API_CONFIG.endpoints.statisticsBasic)
}

/**
 * 获取页面内容
 * @param path 页面路径
 * API 返回: { code: 200, data: PageContent }
 */
export function usePageContent(path: MaybeRef<string>) {
  const pagePath = computed(() => unref(path))

  return useApi<PageContent>(
    computed(() => API_CONFIG.endpoints.page(pagePath.value)),
    {
      key: computed(() => `page-${pagePath.value}`),
    },
  )
}

