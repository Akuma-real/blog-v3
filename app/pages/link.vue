<script setup lang="ts">
import { API_CONFIG } from '~/config/api'
import type { LinkDTO, LinkCategoryDTO, SiteConfig } from '~/types/api'
import type { Arch } from '~/utils/icon'

// ============================================
// 1. 初始化
// ============================================
const appConfig = useAppConfig()

// ============================================
// 2. API 数据获取
// ============================================
const { data: siteConfig } = await useAsyncData(
	'link-page-site-config',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.siteConfig,
				{ baseURL: API_CONFIG.baseURL },
			)
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

const { data: linksData } = await useAsyncData(
	'links',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.links,
				{
					baseURL: API_CONFIG.baseURL,
					query: { pageSize: 999 },
				},
			)
			if (response?.code === 200 && response?.data) {
				const data = response.data
				// 检查是否是分页格式
				if (data.list && Array.isArray(data.list)) {
					return data.list as LinkDTO[]
				}
				// 如果直接是数组
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

const { data: categoriesData } = await useAsyncData(
	'link-categories',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.linkCategories,
				{ baseURL: API_CONFIG.baseURL },
			)
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

// ============================================
// 3. 数据转换层
// ============================================
// 转换为组件期望的格式
const feeds = computed(() => {
	if (!categoriesData.value || !linksData.value)
		return []

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
				feed: link.url,
				date: '2024',
				archs: link.tag?.name ? [link.tag.name as Arch] : [],
			})),
		}
	}).filter((group: any) => group.entries.length > 0)
})

// 构建我的博客信息
const myFeed = computed(() => {
	const config = siteConfig.value
	if (!config)
		return null

	// 处理相对路径的图片 URL
	const getFullUrl = (path?: string) => {
		if (!path)
			return ''
		if (path.startsWith('http://') || path.startsWith('https://'))
			return path
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

// ============================================
// 4. 友链申请表单逻辑
// ============================================
const linkForm = ref({
	name: '',
	url: '',
	logo: '',
	description: '',
})

const isSubmitting = ref(false)
const submitMessage = ref('')
const submitStatus = ref<'success' | 'error'>('success')

// 美化错误提示
function formatErrorMessage(errorMessage: string): string {
	const validationMatch = errorMessage.match(/Field validation for '(\w+)' failed on the '(\w+)' tag/)

	if (validationMatch) {
		const field = validationMatch[1] || ''
		const tag = validationMatch[2] || ''

		const fieldNames: Record<string, string> = {
			'URL': '网站地址',
			'Name': '网站名称',
			'Logo': '网站Logo',
			'Description': '网站描述',
		}

		const tagMessages: Record<string, string> = {
			'url': '格式不正确，请输入完整的网址（如：https://example.com）',
			'required': '不能为空',
			'min': '长度不足',
			'max': '长度超出限制',
			'email': '邮箱格式不正确',
		}

		const fieldName = fieldNames[field] || field
		const tagMessage = tagMessages[tag] || '格式不正确'

		return `${fieldName}${tagMessage}`
	}

	if (errorMessage.includes('参数无效')) {
		if (errorMessage.includes('URL')) {
			return '网站地址格式不正确，请输入完整的网址（如：https://example.com）'
		}
		return '请检查输入信息是否正确'
	}

	const errorMap: Record<string, string> = {
		'network error': '网络连接失败，请检查网络后重试',
		'timeout': '请求超时，请稍后重试',
		'not found': '接口地址不存在，请联系管理员',
		'server error': '服务器错误，请稍后重试',
	}

	const lowerMessage = errorMessage.toLowerCase()
	for (const [key, value] of Object.entries(errorMap)) {
		if (lowerMessage.includes(key)) {
			return value
		}
	}

	return '提交失败，请检查信息是否填写正确'
}

async function submitLinkApply() {
	if (isSubmitting.value)
		return

	// 前端验证
	if (!linkForm.value.name.trim()) {
		submitStatus.value = 'error'
		submitMessage.value = '网站名称不能为空'
		return
	}

	if (!linkForm.value.url.trim()) {
		submitStatus.value = 'error'
		submitMessage.value = '网站地址不能为空'
		return
	}

	// 验证 URL 格式
	try {
		const url = new URL(linkForm.value.url)
		if (!['http:', 'https:'].includes(url.protocol)) {
			submitStatus.value = 'error'
			submitMessage.value = '网站地址必须以 http:// 或 https:// 开头'
			return
		}
	}
	catch {
		submitStatus.value = 'error'
		submitMessage.value = '网站地址格式不正确，请输入完整的网址（如：https://example.com）'
		return
	}

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
			submitMessage.value = formatErrorMessage(response.message || '提交失败，请稍后重试')
		}
	}
	catch (error: any) {
		submitStatus.value = 'error'
		const rawMessage = error.data?.message || error.message || '提交失败，请检查网络连接'
		submitMessage.value = formatErrorMessage(rawMessage)
	}
	finally {
		isSubmitting.value = false
	}
}

// ============================================
// 5. 副作用层 - Layout 和 SEO 设置
// ============================================
const layoutStore = useLayoutStore()

// 初始化时设置
layoutStore.setAside([])
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
				<div class="copy-like-input">
					<span class="prompt">网站名称 *</span>
					<input
						v-model="linkForm.name"
						type="text"
						class="input-field"
						required
						minlength="2"
						maxlength="50"
					>
				</div>

				<div class="copy-like-input">
					<span class="prompt">网站地址 *</span>
					<input
						v-model="linkForm.url"
						type="url"
						class="input-field"
						placeholder="https://example.com"
						required
					>
				</div>

				<div class="copy-like-input">
					<span class="prompt">网站Logo</span>
					<input
						v-model="linkForm.logo"
						type="url"
						class="input-field"
						placeholder="可选"
					>
				</div>

				<div class="copy-like-input">
					<span class="prompt">网站描述</span>
					<textarea
						v-model="linkForm.description"
						class="input-field textarea"
						placeholder="可选"
						rows="2"
						maxlength="200"
					/>
				</div>

				<!-- 错误提示 -->
				<div v-if="submitMessage && submitStatus === 'error'" class="message error">
					{{ submitMessage }}
				</div>

				<!-- 成功提示 -->
				<div v-if="submitMessage && submitStatus === 'success'" class="message success">
					{{ submitMessage }}
				</div>

				<!-- 提交按钮 -->
				<ZButton
					type="submit"
					primary
					:text="isSubmitting ? '提交中...' : '提交申请'"
					:disabled="isSubmitting || !linkForm.name || !linkForm.url"
					style="width: 100%; margin-top: 1rem;"
				/>
			</form>
		</div>
	</template>
</Tab>
</template>

<style lang="scss" scoped>
.link-tab {
	margin: 1rem;
}

.link-apply-form {
	margin-top: 2rem;
}

// 模仿 Copy 组件的样式
.copy-like-input {
	display: flex;
	overflow: clip;
	margin: 0.5rem 0;
	border: 1px solid var(--c-border);
	border-radius: 4px;
	background-color: var(--ld-bg-card);
	font-size: 0.8rem;
	line-height: 2.5;
	transition: border-color 0.2s;

	&:focus-within {
		border-color: var(--c-primary);
		outline: 0.2em solid var(--c-primary-soft);

		.prompt {
			border-inline-end-color: var(--c-primary);
			background-color: var(--c-primary-soft);
			color: var(--c-primary);
		}
	}

	.prompt {
		flex-shrink: 0;
		width: 8em;
		padding: 0 1em;
		border-inline-end: 1px solid var(--c-border);
		background-color: var(--c-bg-2);
		color: var(--c-text-2);
		text-align: center;
		transition: all 0.2s;
	}

	.input-field {
		flex-grow: 1;
		padding: 0 1em;
		outline: none;
		white-space: nowrap;
		background: transparent;
		border: none;

		&::placeholder {
			color: var(--c-text-3);
		}

		&.textarea {
			white-space: pre-wrap;
			resize: vertical;
			min-height: 2.5em;
			line-height: 1.5;
			padding-top: 0.5em;
			padding-bottom: 0.5em;
		}
	}
}

.message {
	margin: 1rem 0;
	padding: 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;

	&.error {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--c-error, #ef4444);
	}

	&.success {
		background-color: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: var(--c-success, #22c55e);
	}
}
</style>
