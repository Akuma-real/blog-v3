<script setup lang="ts">
import { API_CONFIG } from '~/config/api'

// ============================================
// 1. 初始化和路由
// ============================================
const route = useRoute()
const articleId = computed(() => route.path.slice(1))

// ============================================
// 2. API 数据获取
// ============================================
const { data: apiResponse } = await useAsyncData(
	() => `article-${route.path}`,
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.articleDetail(articleId.value),
				{ baseURL: API_CONFIG.baseURL },
			)
			return response.data
		}
		catch (error) {
			console.error('Failed to fetch article:', error)
			return null
		}
	},
)

// ============================================
// 3. 数据转换层 - 将 API 数据转为组件数据
// ============================================
const post = computed(() => {
	if (!apiResponse.value)
		return null

	const article = apiResponse.value
	return {
		title: article.title,
		description: article.summaries?.[0] || '',
		image: article.cover_url || article.top_img_url,
		date: article.created_at,
		updated: article.updated_at,
		categories: article.post_categories?.map((c: any) => c.name) || [],
		tags: article.post_tags?.map((t: any) => t.name) || [],
		type: 'tech' as const,
		path: route.path,
		readingTime: {
			text: `${article.reading_time || 1} min read`,
			minutes: article.reading_time || 1,
			time: (article.reading_time || 1) * 60000,
			words: article.word_count || 0,
		},
		htmlContent: article.content_html || article.content_md,
		body: {
			toc: article.toc || [],
		},
		meta: {},
	}
})

const prevArticle = computed(() => {
	const prev = apiResponse.value?.prev_article
	if (!prev)
		return null
	return {
		title: prev.title,
		path: `/${prev.abbrlink || prev.id}`,
		date: prev.created_at,
		type: 'tech' as const,
	}
})

const nextArticle = computed(() => {
	const next = apiResponse.value?.next_article
	if (!next)
		return null
	return {
		title: next.title,
		path: `/${next.abbrlink || next.id}`,
		date: next.created_at,
		type: 'tech' as const,
	}
})

const excerpt = computed(() => post.value?.description || '')

// ============================================
// 4. 副作用层 - Store 和 SEO 设置
// ============================================
const layoutStore = useLayoutStore()
const contentStore = useContentStore()
const { toc, meta } = storeToRefs(contentStore)

// 监听 post 变化,同步更新 store 和 SEO
watch(post, (newPost) => {
	if (newPost) {
		// 更新 content store
		toc.value = newPost.body.toc ? { links: newPost.body.toc } : { links: [] }
		meta.value = newPost.meta

		// 更新 layout
		layoutStore.setAside(['toc'])

		// 更新 SEO meta
		const seoMeta: Record<string, any> = {
			title: newPost.title,
			ogType: 'article',
			description: newPost.description || '',
		}

		// 只有当 image 是有效字符串时才设置 ogImage
		if (newPost.image && typeof newPost.image === 'string') {
			seoMeta.ogImage = newPost.image
		}

		useSeoMeta(seoMeta)
	}
	else {
		// 404 情况
		route.meta.title = '404'
		layoutStore.setAside(['blog-log'])
	}
}, { immediate: true })

// ============================================
// 5. 向子组件提供数据
// ============================================
provide('post', post)
</script>

<template>
<template v-if="post">
	<PostHeader v-bind="post" />
	<PostExcerpt v-if="excerpt" :excerpt />
	<!-- 使用 v-html 渲染 API 返回的 HTML 内容 -->
	<article
		class="article"
		:class="getPostTypeClassName(post?.type, { prefix: 'md' })"
		v-html="post.htmlContent"
	/>

	<PostFooter v-bind="post" />
	<PostSurround :prev="prevArticle" :next="nextArticle" />
	<PostComment />
</template>

<ZError
	v-else
	icon="solar:confounded-square-bold-duotone"
	title="内容为空或页面不存在"
/>
</template>
