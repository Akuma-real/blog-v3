/**
 * 从 API 获取站点配置并设置全局元数据
 * 这样浏览器标题、图标等信息都能从 API 动态获取
 */
export default defineNuxtPlugin(() => {
	const appConfig = useAppConfig()

	// 获取 API 站点配置（已处理成友好格式）
	const { siteConfig } = useApiSiteConfig()

	// 直接使用 useHead，传入响应式 computed 值
	// useHead 本身支持响应式参数，会自动更新
	useHead({
		// 动态设置标题模板
		titleTemplate: computed(() => {
			const config = siteConfig.value
			if (!config)
				return `%s %separator ${appConfig.title}`
			return `%s %separator ${config.title}`
		}),
		// 动态设置 favicon
		link: computed(() => {
			const config = siteConfig.value
			if (!config?.icon)
				return []
			return [{ rel: 'icon', href: config.icon }]
		}),
	})

	// 同样的方式处理 SEO meta 标签
	useSeoMeta({
		// 作者
		author: computed(() => siteConfig.value?.author.name || appConfig.author?.name),
		// 默认描述
		description: computed(() => siteConfig.value?.description || appConfig.description),
		// OG 标签
		ogSiteName: computed(() => siteConfig.value?.title || appConfig.title),
		ogType: 'website',
		ogUrl: computed(() => siteConfig.value?.url || appConfig.url),
	})

	// 提供给应用使用
	return {
		provide: {
			apiSiteConfig: siteConfig,
		},
	}
})
