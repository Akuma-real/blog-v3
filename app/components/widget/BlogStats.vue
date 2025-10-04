<script setup lang="ts">
import { toZonedTime } from 'date-fns-tz'
import { API_CONFIG } from '~/config/api'
import type { ArchiveSummary } from '~/types/api'

const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()
// 将服务器时区转换为博客指定时区
const buildTime = toZonedTime(runtimeConfig.public.buildTime, appConfig.timezone)

const lastUpdateTime = ref('(获取中)')
const totalWords = ref(appConfig.component.stats.wordCount)
const yearlyTip = ref('')

const blogStats = computed(() => [{
	label: '运营时长',
	value: timeElapse(appConfig.timeEstablished),
	tip: `博客于${appConfig.timeEstablished}上线`,
}, {
	label: '上次更新',
	value: lastUpdateTime,
	tip: `构建于${getLocaleDatetime(buildTime)}`,
}, {
	label: '总字数',
	value: totalWords,
	tip: yearlyTip,
}])

onMounted(async () => {
	lastUpdateTime.value = timeElapse(buildTime)

	try {
		// 并行获取归档数据和文章列表数据
		const [archiveResponse, articlesResponse] = await Promise.all([
			$fetch<any>(API_CONFIG.endpoints.articlesArchives, { baseURL: API_CONFIG.baseURL }),
			$fetch<any>(API_CONFIG.endpoints.articles, {
				baseURL: API_CONFIG.baseURL,
				query: { pageSize: 9999, status: 'PUBLISHED' },
			}),
		])

		// 处理文章字数统计
		// API 返回: { code: 200, data: { list: ArticleListItem[], total, page, pageSize } }
		if (articlesResponse?.code === 200 && articlesResponse.data?.list) {
			const articles = articlesResponse.data.list
			let totalWordsCount = 0
			const yearlyWords: Record<string, number> = {}

			articles.forEach((article: any) => {
				const words = article.word_count || 0
				totalWordsCount += words

				// 按年份统计字数
				const year = new Date(article.created_at).getFullYear().toString()
				yearlyWords[year] = (yearlyWords[year] || 0) + words
			})

			if (totalWordsCount > 0) {
				totalWords.value = formatNumber(totalWordsCount)
			}

			// 处理归档数据，生成年度统计
			// API 返回: { code: 200, data: { list: ArchiveSummary[] } }
			if (archiveResponse?.code === 200 && archiveResponse.data?.list) {
				const archiveList: ArchiveSummary[] = archiveResponse.data.list
				const annualStats: Record<string, { posts: number; words: number }> = {}

				// 按年份分组统计
				archiveList.forEach((item: ArchiveSummary) => {
					const year = item.year.toString()
					if (!annualStats[year]) {
						annualStats[year] = { posts: 0, words: 0 }
					}
					annualStats[year].posts += item.count || 0
					annualStats[year].words = yearlyWords[year] || 0
				})

				// 生成年度提示信息
				if (Object.keys(annualStats).length > 0) {
					yearlyTip.value = Object.entries(annualStats)
						.sort(([a], [b]) => Number(b) - Number(a))
						.map(([year, item]) =>
							`${year}年：${item.posts}篇，${formatNumber(item.words)}字`,
						).join('\n')
				}
			}
		}
	}
	catch (error) {
		console.error('Failed to fetch statistics:', error)
		// 保持使用配置文件中的默认值
	}
})
</script>

<template>
<ZWidget card title="博客统计">
	<ZDlGroup :items="blogStats" size="small" />
</ZWidget>
</template>

