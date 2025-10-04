<script setup lang="ts">
import { API_CONFIG } from '~/config/api'

const appConfig = useAppConfig()

// 从 API 获取站点配置
const { data: siteConfig } = await useAsyncData(
	'footer-site-config',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.siteConfig,
				{ baseURL: API_CONFIG.baseURL },
			)
			if (response?.code === 200 && response?.data) {
				return response.data
			}
			return null
		}
		catch (error) {
			console.error('Failed to fetch site config:', error)
			return null
		}
	},
)

// 生成版权信息，优先使用 API 数据
const copyright = computed(() => {
	const owner = siteConfig.value?.footer?.owner
	if (owner?.name && owner?.since) {
		const currentYear = new Date().getFullYear()
		const yearRange = owner.since === currentYear ? currentYear : `${owner.since}-${currentYear}`
		return `© ${yearRange} ${owner.name}`
	}
	return appConfig.footer.copyright
})

// 页脚导航：从 API 获取数据，本地配置图标映射
const footerNav = computed(() => {
	const projectList = siteConfig.value?.footer?.project?.list
	if (projectList && Array.isArray(projectList)) {
		return projectList.map((group: any) => ({
			title: group.title,
			items: (group.links || []).map((link: any) => ({
				icon: getIconForLink(link.title, link.link),
				text: link.title,
				url: link.link,
			})),
		}))
	}

	// API 失败时回退到配置文件
	return appConfig.footer.nav
})

// 精确匹配图标（精确匹配优先，常见词兜底）
function getIconForLink(title: string, url: string): string {
	const mapping = appConfig.footer.apiIconMapping || {}

	// 1. 优先按标题精确匹配（用户自定义，优先级最高）
	if (title && mapping[title]) {
		return mapping[title]
	}

	// 2. 按 URL 精确匹配（用户自定义）
	if (url && mapping[url]) {
		return mapping[url]
	}

	// 3. 常见关键词兜底匹配（提供基本可用性，避免都是默认图标）
	const lowerTitle = title?.toLowerCase() || ''
	const lowerUrl = url?.toLowerCase() || ''

	// 常见的通用关键词（只保留最常见的，不过度猜测）
	const commonKeywords: Record<string, string> = {
		// RSS 相关
		'rss': 'ph:rss-simple-bold',
		'atom': 'ph:rss-simple-bold',
		'feed': 'ph:rss-simple-bold',
		'subscribe': 'ph:rss-simple-bold',
		'订阅': 'ph:rss-simple-bold',

		// GitHub 相关
		'github': 'ph:github-logo-bold',
		'源码': 'ph:github-logo-bold',
		'source': 'ph:github-logo-bold',

		// 文档相关
		'doc': 'ph:book-bold',
		'文档': 'ph:book-bold',

		// 更新日志
		'update': 'ph:newspaper-bold',
		'changelog': 'ph:newspaper-bold',
		'更新': 'ph:newspaper-bold',
		'日志': 'ph:newspaper-bold',
	}

	// 检查标题或 URL 中是否包含常见关键词
	for (const [keyword, icon] of Object.entries(commonKeywords)) {
		if (lowerTitle.includes(keyword) || lowerUrl.includes(keyword)) {
			return icon
		}
	}

	// 4. 都没匹配到，使用默认链接图标
	return 'ph:link-bold'
}
</script>

<template>
<footer class="z-footer">
	<nav class="footer-nav">
		<div v-for="(group, groupIndex) in footerNav" :key="groupIndex" class="footer-nav-group">
			<h3 v-if="group.title">
				{{ group.title }}
			</h3>
			<menu>
				<li v-for="(item, itemIndex) in group.items" :key="itemIndex">
					<ZRawLink :to="item.url">
						<Icon :name="item.icon" />
						<span class="nav-text">{{ item.text }}</span>
					</ZRawLink>
				</li>
			</menu>
		</div>
	</nav>
	<p>{{ copyright }}</p>
</footer>
</template>

<style lang="scss" scoped>
.z-footer {
	margin: 3rem 1rem;
	font-size: 0.9em;
	color: var(--c-text-2);

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 5vw clamp(2rem, 5%, 5vw);
		padding-block: 3rem;

		h3 {
			margin: 0.5em;
			font: inherit;
		}

		a {
			display: flex;
			align-items: center;
			gap: 0.3em;
			width: fit-content;
			padding: 0.3em 0.5em;
			border-radius: 0.5em;
			font-size: 0.9em;
			transition: background-color 0.2s, color 0.1s;

			&:hover {
				background-color: var(--c-bg-soft);
				color: var(--c-text);
			}
		}
	}

	p {
		margin: 0.5em;
	}
}
</style>
