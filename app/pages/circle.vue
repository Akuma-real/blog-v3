<script setup lang="ts">
import type { CircleData } from '~/types/circle'

const appConfig = useAppConfig()
const initialNow = useInitialNow()

// 侧边栏配置
const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats'])

// 获取圈子数据（仅客户端）与懒加载缓存
const { data: circleData, error, pending } = await useLazyFetch<CircleData>(
	'https://circle-api.june.ink/data.json',
	{
		server: false,
		key: 'circle-data',
		default: () => ({
			statistical_data: {
				friends_num: 0,
				active_num: 0,
				error_num: 0,
				article_num: 0,
				last_updated_time: '',
			},
			article_data: [],
		}),
	},
)

// 分页功能（复用主页分页逻辑）
const articleList = computed(() => circleData.value?.article_data || [])
const { page, totalPages, listPaged } = usePagination(articleList, { bindQuery: 'page' })

// SEO（需在 page 定义后使用）
useSeoMeta({
	title: computed(() => (page.value > 1 ? `圈子 - 第${page.value}页` : '圈子')),
	description: `${appConfig.title}的朋友圈动态，展示朋友们的最新文章和动态。`,
})

// 最近更新时间文案
function formatCircleDate(value?: string | number | Date) {
	if (!value)
		return ''
	const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
	return getPostDate(date, initialNow.value)
}

const lastUpdated = computed(() => {
	if (!circleData.value?.statistical_data?.last_updated_time)
		return ''
	return formatCircleDate(circleData.value.statistical_data.last_updated_time)
})
</script>

<template>
<ClientOnly>
	<div class="circle">
		<div class="mobile-only">
			<ZhiluHeader to="/" suffix="圈子" />
		</div>

		<!-- 加载状态 -->
		<div v-if="pending" class="circle-loading" aria-busy="true" aria-live="polite">
			<div class="loading-skeleton">
				<div class="skeleton-stats">
					<div class="skeleton-line skeleton-title" />
					<div class="skeleton-line skeleton-content" />
				</div>
				<div class="skeleton-articles">
					<div v-for="i in 3" :key="i" class="skeleton-article">
						<div class="skeleton-avatar" />
						<div class="skeleton-info">
							<div class="skeleton-line skeleton-author" />
							<div class="skeleton-line skeleton-title" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 错误状态 -->
		<div v-else-if="error" class="circle-error">
			<ZError>
				<template #title>
					加载失败
				</template>
				<template #description>
					无法获取圈子数据，可能是网络问题或跨域限制。
					<br>
					<span class="error-detail">{{ error.message }}</span>
				</template>
			</ZError>
		</div>

		<!-- 正常内容 -->
		<div v-else class="circle-content">
			<!-- 统计信息 -->
			<section class="circle-stats">
				<h2 class="stats-title">
					圈子统计
				</h2>
				<ZDlGroup
					v-if="circleData?.statistical_data"
					:items="[
						{ label: '朋友数', value: circleData.statistical_data.friends_num || 0 },
						{ label: '活跃站点', value: circleData.statistical_data.active_num || 0 },
						{ label: '收录文章', value: circleData.statistical_data.article_num || 0 },
						{ label: '异常站点', value: circleData.statistical_data.error_num || 0 },
						{ label: '最后更新', value: lastUpdated || '暂无数据' },
					]"
					size="small"
				/>
				<div v-else class="stats-placeholder">
					<div class="skeleton-line skeleton-title" />
					<div class="skeleton-stats-grid">
						<div v-for="i in 2" :key="i" class="skeleton-stat">
							<div class="skeleton-line skeleton-label" />
							<div class="skeleton-line skeleton-value" />
						</div>
					</div>
				</div>
			</section>

			<!-- 文章列表 -->
			<section class="circle-articles">
				<h2 class="articles-title">
					最新动态
				</h2>
				<div v-if="articleList.length === 0" class="articles-empty">
					<ZError>
						<template #title>
							暂无动态
						</template>
						<template #description>
							还没有朋友发布文章
						</template>
					</ZError>
				</div>
				<div v-else class="articles-list">
					<TransitionGroup appear name="float-in">
						<article
							v-for="(article, index) in listPaged"
							:key="article.floor"
							class="article-item card"
							:style="{ '--delay': `${index * 0.05}s` }"
						>
							<div class="article-header">
								<NuxtImg
									:src="article.avatar"
									:alt="article.author"
									class="article-avatar"
									loading="lazy"
									decoding="async"
									sizes="(max-width: 768px) 40px, 48px"
								/>
								<div class="article-meta">
									<span class="article-author">{{ article.author }}</span>
									<time class="article-time">{{ formatCircleDate(article.updated || article.created) }}</time>
								</div>
								<span class="article-floor">#{{ article.floor }}</span>
							</div>
							<h3 class="article-title">
								<NuxtLink
									:to="article.link"
									target="_blank"
									rel="noopener noreferrer"
									class="article-link"
									:aria-label="`查看 ${article.author} 的《${article.title}》`"
								>
									{{ article.title }}
								</NuxtLink>
							</h3>
						</article>
					</TransitionGroup>

					<!-- 分页组件 -->
					<ZPagination v-model="page" :total-pages="totalPages" />
				</div>
			</section>
		</div>
	</div>

	<template #fallback>
		<div class="circle">
			<div class="mobile-only">
				<ZhiluHeader to="/" suffix="圈子" />
			</div>
			<div class="circle-loading">
				<div class="loading-skeleton">
					<div class="skeleton-stats">
						<div class="skeleton-line skeleton-title" />
						<div class="skeleton-line skeleton-content" />
					</div>
					<div class="skeleton-articles">
						<div v-for="i in 3" :key="i" class="skeleton-article">
							<div class="skeleton-avatar" />
							<div class="skeleton-info">
								<div class="skeleton-line skeleton-author" />
								<div class="skeleton-line skeleton-title" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</template>
</ClientOnly>
</template>

<style lang="scss" scoped>
.circle {
	margin: 1rem;
}

// 加载状态样式
.circle-loading {
	.loading-skeleton {
		display: grid;
		gap: 2rem;
	}

	.skeleton-stats {
		margin-bottom: 2rem;
		padding: 1.5rem;
		border-radius: 0.8rem;
		background: var(--c-bg-card);
	}

	.skeleton-articles {
		display: grid;
		gap: 1rem;
	}

	.skeleton-article {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 0.8rem;
		background: var(--c-bg-card);
	}

	.skeleton-avatar {
		flex-shrink: 0;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: var(--c-bg-mute);
	}

	.skeleton-info {
		display: grid;
		flex: 1;
		gap: 0.5rem;
	}

	.skeleton-line {
		height: 1rem;
		border-radius: 0.5rem;
		background: var(--c-bg-mute);
		animation: skeleton-pulse 1.5s ease-in-out infinite;

		&.skeleton-title {
			width: 8rem;
			height: 1.5rem;
		}

		&.skeleton-content {
			width: 12rem;
		}

		&.skeleton-author {
			width: 6rem;
		}
	}
}

@keyframes skeleton-pulse {
	0%, 100% { opacity: 0.6; }
	50% { opacity: 0.3; }
}

// 错误状态样式
.circle-error {
	margin: 2rem 0;

	.error-detail {
		font-family: var(--font-mono);
		font-size: 0.9em;
		color: var(--c-text-3);
	}
}

// 主要内容样式
.circle-content {
	display: grid;
	gap: 2rem;
}

// 统计信息样式
.circle-stats {
	padding: 1.5rem;
	border: 1px solid var(--c-border);
	border-radius: 0.8rem;
	background: var(--c-bg-card);

	.stats-title {
		margin: 0 0 1rem;
		font-size: 1.2em;
		font-weight: 600;
		color: var(--c-text);
	}

	.stats-placeholder {
		display: grid;
		gap: 1rem;
	}

	.skeleton-stats-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.skeleton-stat {
		display: grid;
		flex: 1;
		gap: 0.5rem;
		min-width: 80px;
		text-align: center;
	}

	.skeleton-label {
		width: 60%;
		margin: 0 auto;
	}

	.skeleton-value {
		width: 40%;
		height: 1.2rem;
		margin: 0 auto;
	}
}

// 文章列表样式
.circle-articles {
	.articles-title {
		margin: 0 0 1.5rem;
		font-size: 1.2em;
		font-weight: 600;
		color: var(--c-text);
	}

	.articles-empty {
		margin: 2rem 0;
	}
}

.articles-list {
	display: grid;
	gap: 1rem;
}

.article-item {
	padding: 1.5rem;
	border: 1px solid var(--c-border);
	border-radius: 0.8rem;
	background: var(--c-bg-card);
	transition: all 0.2s;
	animation: float-in 0.3s var(--delay) backwards;

	&:hover {
		border-color: var(--c-primary);
		box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
		transform: translateY(-2px);
	}
}

.article-header {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;
}

.article-avatar {
	flex-shrink: 0;
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	object-fit: cover;
}

.article-meta {
	flex: 1;
	min-width: 0;
}

.article-author {
	display: block;
	font-size: 0.95em;
	font-weight: 500;
	color: var(--c-text);
}

.article-time {
	display: block;
	margin-top: 0.2rem;
	font-size: 0.85em;
	color: var(--c-text-3);
}

.article-floor {
	font-size: 0.9em;
	font-weight: 500;
	color: var(--c-text-3);
}

.article-title {
	margin: 0;
	font-size: 1.1em;
	font-weight: 500;
	line-height: 1.4;
}

.article-link {
	text-decoration: none;
	color: var(--c-text);
	transition: color 0.2s;
}

.article-link:hover {
	color: var(--c-primary);
}

// 响应式适配
@media (max-width: $breakpoint-mobile) {
	.circle {
		margin: 0.5rem;
	}

	.circle-stats {
		padding: 1rem;
	}

	.article-item {
		padding: 1rem;
	}

	.article-header {
		gap: 0.8rem;
	}

	.article-avatar {
		width: 2.5rem;
		height: 2.5rem;
	}

	.article-title {
		font-size: 1em;
	}
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
	.skeleton-line {
		background: var(--c-bg-soft);
	}
}
</style>
