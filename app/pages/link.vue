<script setup lang="ts">
import { API_CONFIG } from '~~/app/config/api'
import type { LinkDTO, LinkCategoryDTO, SiteConfig } from '~/types/api'
import type { Arch } from '~/utils/icon'

const appConfig = useAppConfig()
const layoutStore = useLayoutStore()
layoutStore.setAside([])

// 从 API 获取站点配置
const { data: siteConfig } = await useAsyncData(
	'link-page-site-config',
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
)

// 从 API 获取友链数据
// 注意：API 文档说返回数组，但实际返回的是分页格式！
// 实际返回: { code: 200, data: { list: LinkDTO[], total, page, pageSize } }
const { data: linksData } = await useAsyncData(
	'links',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.links,
				{
					baseURL: API_CONFIG.baseURL,
					query: { pageSize: 999 }, // 获取尽可能多的友链
				},
			)
			// 实际返回的是分页对象，需要取 list 字段
			if (response?.code === 200 && response?.data) {
				const data = response.data
				// 检查是否是分页格式
				if (data.list && Array.isArray(data.list)) {
					return data.list as LinkDTO[]
				}
				// 如果直接是数组（虽然实际不是）
				if (Array.isArray(data)) {
					return data as LinkDTO[]
				}
				console.warn('Unexpected links data format:', data)
				return []
			}
			return []
		}
		catch (error) {
			console.error('Failed to fetch links:', error)
			return []
		}
	},
)

// 从 API 获取友链分类
// API 返回: { code: 200, data: LinkCategoryDTO[] } - 直接返回数组,不是分页对象
const { data: categoriesData } = await useAsyncData(
	'link-categories',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.linkCategories,
				{ baseURL: API_CONFIG.baseURL },
			)
			// API 返回的是数组,不是分页对象
			if (response?.code === 200 && response?.data) {
				return response.data as LinkCategoryDTO[]
			}
			return []
		}
		catch (error) {
			console.error('Failed to fetch link categories:', error)
			return []
		}
	},
)

// 转换为组件期望的格式
const feeds = computed(() => {
	if (!categoriesData.value || !linksData.value)
		return []

	// 确保 linksData 是数组
	const links = Array.isArray(linksData.value) ? linksData.value : []
	if (links.length === 0) {
		console.warn('No links data available')
		return []
	}

	return categoriesData.value.map((category: LinkCategoryDTO) => {
		const categoryLinks = links.filter(
			(link: LinkDTO) => link.category?.id === category.id && link.status === 'APPROVED',
		) || []

		return {
			name: category.name,
			entries: categoryLinks.map((link: LinkDTO) => ({
				author: link.name,
				sitenick: link.name,
				title: link.name,
				desc: link.description || '',
				link: link.url,
				avatar: link.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(link.name)}`,
				icon: link.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(link.name)}`,
				feed: link.url, // API 不提供 RSS，使用网站 URL
				date: '2024', // API 不提供日期，使用默认值
				archs: link.tag?.name ? [link.tag.name as Arch] : [], // 使用 tag.name 作为技术栈标签
			})),
		}
	}).filter((group: any) => group.entries.length > 0)
})

// 获取友链说明页面（如果 API 支持）
const { data: postLink } = await useAsyncData(
	'/link',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.page('link'),
				{
					baseURL: API_CONFIG.baseURL,
					// 忽略 404 错误，避免在控制台显示
					ignoreResponseError: true,
				},
			)
			if (response?.code === 200 && response.data) {
				return {
					htmlContent: response.data.htmlContent || response.data.content,
				}
			}
		}
		catch (error) {
			// 页面内容不存在是正常的，静默处理
		}
		return null
	},
)

// 构建我的博客信息（从 API 站点配置）
const myFeed = computed(() => {
	const config = siteConfig.value
	if (!config)
		return null

	// 处理相对路径的图片 URL
	const getFullUrl = (path?: string) => {
		if (!path)
			return ''
		// 如果已经是完整 URL，直接返回
		if (path.startsWith('http://') || path.startsWith('https://'))
			return path
		// 相对路径，拼接 API baseURL
		return `${API_CONFIG.baseURL}${path}`
	}

	return {
		author: config.APP_NAME || appConfig.title,
		sitenick: config.SUB_TITLE || appConfig.subtitle,
		title: config.APP_NAME || appConfig.title,
		desc: config.SITE_DESCRIPTION || appConfig.description,
		link: config.SITE_URL || appConfig.url,
		avatar: getFullUrl(config.USER_AVATAR || config.LOGO_URL) || appConfig.author?.avatar,
		icon: getFullUrl(config.ICON_URL || config.LOGO_URL) || appConfig.favicon,
		feed: `${config.SITE_URL || appConfig.url}/atom.xml`,
		archs: ['Nuxt', 'Vercel'] as Arch[],
		date: appConfig.timeEstablished,
	}
})

const copyFields = computed(() => {
	if (!myFeed.value)
		return {}

	return {
		博主: myFeed.value.author,
		标题: myFeed.value.title,
		介绍: myFeed.value.desc,
		网址: myFeed.value.link,
		头像: myFeed.value.avatar,
	}
})

// 友链申请表单
const linkForm = ref({
	name: '',
	url: '',
	logo: '',
	description: '',
})

const isSubmitting = ref(false)
const submitMessage = ref('')
const submitStatus = ref<'success' | 'error'>('success')

async function submitLinkApply() {
	if (isSubmitting.value)
		return

	isSubmitting.value = true
	submitMessage.value = ''

	try {
		const response = await $fetch<any>(
			API_CONFIG.endpoints.links,
			{
				method: 'POST',
				baseURL: API_CONFIG.baseURL,
				body: {
					name: linkForm.value.name,
					url: linkForm.value.url,
					logo: linkForm.value.logo || undefined,
					description: linkForm.value.description || undefined,
				},
			},
		)

		if (response.code === 200) {
			submitStatus.value = 'success'
			submitMessage.value = '友链申请已提交，请等待管理员审核！'
			// 清空表单
			linkForm.value = {
				name: '',
				url: '',
				logo: '',
				description: '',
			}
		}
		else {
			submitStatus.value = 'error'
			submitMessage.value = response.message || '提交失败，请稍后重试'
		}
	}
	catch (error: any) {
		submitStatus.value = 'error'
		submitMessage.value = error.data?.message || '提交失败，请检查网络连接'
	}
	finally {
		isSubmitting.value = false
	}
}

useSeoMeta({
	title: '友链',
	ogType: 'profile',
	description: `${siteConfig.value?.APP_NAME || appConfig.title}的友链页面，收集了添加他为友链的网站和他订阅的网站列表。`,
})
</script>

<template>
<div class="mobile-only">
	<ZhiluHeader to="/" suffix="友链" />
</div>

<FeedGroup :feeds />

<Tab :tabs="['我的博客信息', '申请友链']" center>
	<template #tab1>
		<div v-if="myFeed" class="link-tab">
			<FeedCard v-bind="myFeed" />
			<Copy v-for="(code, prompt) in copyFields" :key="prompt" :prompt :code />
		</div>
		<p v-else class="text-center">
			加载中...
		</p>
	</template>
	<template #tab2>
		<div class="link-tab">
			<!-- 友链申请说明 -->
			<div
				v-if="siteConfig?.FRIEND_LINK_APPLY_CUSTOM_CODE_HTML"
				class="article"
				v-html="siteConfig.FRIEND_LINK_APPLY_CUSTOM_CODE_HTML"
			/>

			<!-- 友链申请表单 -->
			<form class="link-apply-form" @submit.prevent="submitLinkApply">
				<Copy prompt="网站名称 *" :code="linkForm.name" @input="linkForm.name = $event.target.textContent" />
				<Copy prompt="网站地址 *" :code="linkForm.url" @input="linkForm.url = $event.target.textContent" />
				<Copy prompt="网站Logo" :code="linkForm.logo" @input="linkForm.logo = $event.target.textContent" />
				<Copy prompt="网站描述" :code="linkForm.description" @input="linkForm.description = $event.target.textContent" />

				<ZButton
					type="submit"
					primary
					:text="isSubmitting ? '提交中...' : '提交申请'"
					:disabled="isSubmitting || !linkForm.name || !linkForm.url"
					style="width: 100%; margin-top: 1rem;"
				/>

				<p v-if="submitMessage" class="submit-message" :class="submitStatus">
					{{ submitMessage }}
				</p>
			</form>
		</div>
	</template>
</Tab>

<!-- 友链页面不需要评论功能，移除或者在需要时添加 post 提供 -->
<!-- <PostComment /> -->
</template>

<style lang="scss" scoped>
.link-tab {
	margin: 1rem;
}

.link-apply-form {
	margin-top: 2rem;

	:deep(.copy .prompt) {
		width: 8em;
		text-align: center;
	}
}

.submit-message {
	margin-top: 1rem;
	padding: 0.8rem;
	border-radius: 4px;
	text-align: center;
	font-size: 0.9rem;

	&.success {
		background-color: var(--c-primary-soft);
		color: var(--c-primary);
	}

	&.error {
		background-color: #f8d7da;
		color: #721c24;
	}
}
</style>

