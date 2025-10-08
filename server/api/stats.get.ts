/**
 * 统计数据聚合接口
 * 从后端 API 获取数据并聚合统计
 */
export default defineEventHandler(async (event) => {
	try {
		const config = useRuntimeConfig(event)
		const apiBaseURL = config.public.apiBaseUrl as string

		// 并行获取归档数据和文章列表
		const [archiveResponse, articlesResponse] = await Promise.all([
			$fetch<any>('/api/public/articles/archives', { baseURL: apiBaseURL }),
			$fetch<any>('/api/public/articles', {
				baseURL: apiBaseURL,
				query: { pageSize: 9999, status: 'PUBLISHED' },
			}),
		])

		// 处理文章字数统计
		let totalWords = 0
		const yearlyWords: Record<string, number> = {}
		const annualStats: Record<string, { posts: number; words: number }> = {}

		if (articlesResponse?.code === 200 && articlesResponse.data?.list) {
			const articles = articlesResponse.data.list

			articles.forEach((article: any) => {
				const words = article.word_count || 0
				totalWords += words

				// 按年份统计字数
				const year = new Date(article.created_at).getFullYear().toString()
				yearlyWords[year] = (yearlyWords[year] || 0) + words
			})
		}

		// 处理归档数据，生成年度统计
		if (archiveResponse?.code === 200 && archiveResponse.data?.list) {
			const archiveList = archiveResponse.data.list

			// 按年份分组统计
			archiveList.forEach((item: any) => {
				const year = item.year.toString()
				if (!annualStats[year]) {
					annualStats[year] = { posts: 0, words: 0 }
				}
				annualStats[year].posts += item.count || 0
				annualStats[year].words = yearlyWords[year] || 0
			})
		}

		// 返回统计数据
		return {
			total: {
				posts: articlesResponse.data?.total || 0,
				words: totalWords,
			},
			annual: annualStats,
			categories: [], // 暂不实现分类统计
			tags: [], // 暂不实现标签统计
		}
	}
	catch (error) {
		console.error('Failed to fetch statistics:', error)
		// 返回空统计数据作为降级
		return {
			total: { posts: 0, words: 0 },
			annual: {},
			categories: [],
			tags: [],
		}
	}
})
