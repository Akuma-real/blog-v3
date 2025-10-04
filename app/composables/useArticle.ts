import type ArticleProps from '~/types/article'
import type { ArticleOrderType } from '~/types/article'
import { alphabetical } from 'radash'
import { API_CONFIG } from '~/config/api'
import type { ArticleListItem } from '~/types/api'

/**
 * 获取文章索引（从 API）
 * @param path 暂时保留参数以保持兼容性，但不再使用
 */
export function useArticleIndex(path = 'posts/%') {
	return useAsyncData<ArticleProps[]>(
		`index_${path}`,
		async () => {
			try {
				const response = await $fetch<any>(API_CONFIG.endpoints.articles, {
					baseURL: API_CONFIG.baseURL,
					query: { pageSize: 999 }, // 获取所有文章用于前端排序和筛选
				})

				// API 返回结构: { code: 200, message: "...", data: { list: [...], total, page, pageSize } }
				if (response?.code !== 200 || !response?.data?.list) {
					console.error('获取文章列表失败:', response?.message)
					return []
				}

				const articles: ArticleListItem[] = response.data.list

				// 转换为组件期望的格式
				return articles.map((item: ArticleListItem) => ({
					path: `/${item.abbrlink || item.id}`,
					title: item.title,
					description: item.summaries?.[0] || '',
					date: item.created_at,
					updated: item.updated_at,
					categories: item.post_categories?.map((c) => c.name) || [],
					tags: item.post_tags?.map((t) => t.name) || [],
					type: 'tech' as const,
					image: item.cover_url || item.top_img_url,
					recommend: item.home_sort || item.pin_sort,
					readingTime: {
						text: `${item.reading_time || 1} min read`,
						minutes: item.reading_time || 1,
						time: (item.reading_time || 1) * 60000,
						words: item.word_count || 0,
					},
				}))
			}
			catch (error) {
				console.error('获取文章索引出错:', error)
				return []
			}
		},
		{ default: () => [] },
	)
}

interface UseCategoryOptions {
	bindQuery?: string | false
}

export function useCategory(list: MaybeRefOrGetter<ArticleProps[]>, options?: UseCategoryOptions) {
	const { bindQuery } = options ?? {}
	const category = bindQuery
		? useRouteQuery(bindQuery, undefined, { transform: (value?: string) => value, mode: 'push' })
		: ref<string | undefined>()
	const categories = computed(() => [...new Set(toValue(list).map(item => item.categories?.[0]).filter(Boolean))])
	const listCategorized = computed(
		() => toValue(list).filter(
			item => !category.value || item.categories?.[0] === category.value,
		),
	)

	return {
		category,
		categories,
		listCategorized,
	}
}

export function useArticleSort(list: MaybeRefOrGetter<ArticleProps[]>) {
	const appConfig = useAppConfig()
	const sortOrder = ref<ArticleOrderType>(appConfig.pagination.sortOrder || 'date')
	const isAscending = ref<boolean>()
	const listSorted = computed(() => alphabetical(
		toValue(list),
		item => item[sortOrder.value] || '',
		isAscending.value ? 'asc' : 'desc',
	))
	return {
		sortOrder,
		isAscending,
		listSorted,
	}
}

export function getCategoryIcon(category?: string) {
	const appConfig = useAppConfig()
	return appConfig.article.categories[category!]?.icon ?? 'ph:folder-bold'
}

export function getPostTypeClassName(type?: string, options = {
	prefix: 'text',
}) {
	if (!type)
		type = 'tech'

	const { prefix } = options

	return `${prefix}-${type}`
}

