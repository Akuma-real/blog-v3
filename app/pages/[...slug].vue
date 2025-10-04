<script setup lang="ts">
import { API_CONFIG } from '~/config/api'
import type { ArticleDetailResponse } from '~/types/api'

const route = useRoute()

const layoutStore = useLayoutStore()
layoutStore.setAside(['toc'])

// 从路径中提取文章 ID（去除开头的 /）
const articleId = computed(() => route.path.slice(1))

// 从 API 获取文章详情
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

// 转换 API 数据为组件期望的格式
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
		// HTML 内容
		htmlContent: article.content_html || article.content_md,
		body: {
			toc: article.toc || [],
		},
		meta: {},
	}
})

// 转换上一篇/下一篇文章数据
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

const contentStore = useContentStore()
const { toc, meta } = storeToRefs(contentStore)
toc.value = post.value?.body.toc
meta.value = post.value?.meta

const excerpt = computed(() => post.value?.description || '')

// 向子组件提供 post 数据
provide('post', post)

if (post.value) {
	useSeoMeta({
		title: post.value.title,
		ogType: 'article',
		ogImage: post.value.image || '',
		description: post.value.description || '',
	})
	layoutStore.setAside(post.value.meta?.aside as WidgetName[] | undefined)
}
else {
	route.meta.title = '404'
	layoutStore.setAside(['blog-log'])
}
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
