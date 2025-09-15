<script setup lang="ts">
import type { CircleData } from '~/types/circle'

const appConfig = useAppConfig()

// 侧边栏配置
const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats'])

// 获取圈子数据（异步预加载）
const { data: circleData, error, pending } = await useLazyFetch<CircleData>(
	'https://circle-api.june.ink/data.json',
	{
		server: false, // 仅在客户端执行
		key: 'circle-data', // 添加缓存键
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

// SEO配置（必须在page定义之后）
useSeoMeta({
	title: computed(() => page.value > 1 ? `圈子 - 第${page.value}页` : '圈子'),
	description: `${appConfig.title}的朋友圈动态，展示朋友们的最新文章和动态。`,
})

// 格式化时间
const lastUpdated = computed(() => {
	if (!circleData.value?.statistical_data?.last_updated_time) return ''
	return getPostDate(new Date(circleData.value.statistical_data.last_updated_time))
})
</script>

<template>
<ClientOnly>
	<div class="circle">
		<div class="mobile-only">
			<ZhiluHeader to="/" suffix="圈子" />
		</div>

		<!-- 加载状态 -->
		<div v-if="pending" class="circle-loading">
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
				<template #title>加载失败</template>
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
				<h2 class="stats-title">圈子统计</h2>
				<ZDlGroup
					v-if="circleData?.statistical_data"
					:items="[
						{ label: '朋友数', value: circleData.statistical_data.friends_num || 0 },
						{ label: '活跃数', value: circleData.statistical_data.active_num || 0 },
						{ label: '错误数', value: circleData.statistical_data.error_num || 0 },
						{ label: '文章数', value: circleData.statistical_data.article_num || 0 },
					]"
					size="small"
				/>
				<div v-else class="stats-placeholder">
					<div class="skeleton-line skeleton-title" />
					<div class="skeleton-stats-grid">
						<div v-for="i in 4" :key="i" class="skeleton-stat">
							<div class="skeleton-line skeleton-label" />
							<div class="skeleton-line skeleton-value" />
						</div>
					</div>
				</div>
				<p v-if="lastUpdated" class="stats-updated">
					最后更新：{{ lastUpdated }}
				</p>
			</section>

			<!-- 文章列表 -->
			<section class="circle-articles">
				<h2 class="articles-title">最新动态</h2>
				<div v-if="articleList.length === 0" class="articles-empty">
					<ZError>
						<template #title>暂无动态</template>
						<template #description>还没有朋友发布文章</template>
					</ZError>
				</div>
				<div v-else class="articles-list">
					<TransitionGroup appear name="float-in">
						<article
							v-for="(article, index) in listPaged"
							:key="article.floor"
							class="article-item"
							:style="{ '--delay': `${index * 0.05}s` }"
						>
							<div class="article-header">
								<NuxtImg
									:src="article.avatar"
									:alt="article.author"
									class="article-avatar"
									loading="lazy"
								/>
								<div class="article-meta">
									<span class="article-author">{{ article.author }}</span>
									<time class="article-time">{{ getPostDate(new Date(article.updated || article.created)) }}</time>
								</div>
								<span class="article-floor">#{{ article.floor }}</span>
							</div>
							<h3 class="article-title">
								<NuxtLink
									:to="article.link"
									target="_blank"
									rel="noopener noreferrer"
									class="article-link"
								>
									{{ article.title }}
								</NuxtLink>
							</h3>
						</article>
					</TransitionGroup>

					<!-- 分页组件 -->
					<ZPagination v-model="page" :total-pages />
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
		space-y: 2rem;
	}

	.skeleton-stats {
		padding: 1.5rem;
		background: var(--c-bg-card);
		border-radius: 0.8rem;
		margin-bottom: 2rem;
	}

	.skeleton-articles {
		space-y: 1rem;
	}

	.skeleton-article {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--c-bg-card);
		border-radius: 0.8rem;
	}

	.skeleton-avatar {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: var(--c-bg-mute);
		flex-shrink: 0;
	}

	.skeleton-info {
		flex: 1;
		space-y: 0.5rem;
	}

	.skeleton-line {
		height: 1rem;
		background: var(--c-bg-mute);
		border-radius: 0.5rem;
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
	0%, 100% {
		opacity: 0.6;
	}
	50% {
		opacity: 0.3;
	}
}

// 错误状态样式
.circle-error {
	margin: 2rem 0;

	.error-detail {
		font-size: 0.9em;
		color: var(--c-text-3);
		font-family: var(--font-mono);
	}
}

// 主要内容样式
.circle-content {
	space-y: 2rem;
}

// 统计信息样式
.circle-stats {
	padding: 1.5rem;
	background: var(--c-bg-card);
	border-radius: 0.8rem;
	border: 1px solid var(--c-border);

	.stats-title {
		margin: 0 0 1rem 0;
		font-size: 1.2em;
		font-weight: 600;
		color: var(--c-text);
	}

	.stats-placeholder {
		space-y: 1rem;
	}

	.skeleton-stats-grid {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.skeleton-stat {
		flex: 1;
		min-width: 80px;
		text-align: center;
		space-y: 0.5rem;
	}

	.skeleton-label {
		width: 60%;
		margin: 0 auto;
	}

	.skeleton-value {
		width: 40%;
		margin: 0 auto;
		height: 1.2rem;
	}

	.stats-updated {
		margin: 1rem 0 0 0;
		font-size: 0.9em;
		color: var(--c-text-3);
		text-align: center;
		padding-top: 1rem;
		border-top: 1px solid var(--c-border);
	}
}

// 文章列表样式
.circle-articles {
	.articles-title {
		margin: 0 0 1.5rem 0;
		font-size: 1.2em;
		font-weight: 600;
		color: var(--c-text);
	}

	.articles-empty {
		margin: 2rem 0;
	}
}

.articles-list {
	space-y: 1rem;
}

.article-item {
	padding: 1.5rem;
	background: var(--c-bg-card);
	border-radius: 0.8rem;
	border: 1px solid var(--c-border);
	transition: all 0.2s;
	animation: float-in 0.3s var(--delay) backwards;

	&:hover {
		border-color: var(--c-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
}

.article-header {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1rem;
}

.article-avatar {
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	object-fit: cover;
	flex-shrink: 0;
}

.article-meta {
	flex: 1;
	min-width: 0;
}

.article-author {
	display: block;
	font-weight: 500;
	color: var(--c-text);
	font-size: 0.95em;
}

.article-time {
	display: block;
	font-size: 0.85em;
	color: var(--c-text-3);
	margin-top: 0.2rem;
}

.article-floor {
	font-size: 0.9em;
	color: var(--c-text-3);
	font-weight: 500;
}

.article-title {
	margin: 0;
	font-size: 1.1em;
	font-weight: 500;
	line-height: 1.4;
}

.article-link {
	color: var(--c-text);
	text-decoration: none;
	transition: color 0.2s;

	&:hover {
		color: var(--c-primary);
	}
}

// 响应式设计
@media (max-width: $breakpoint-mobile) {
	.circle {
		margin: 0.5rem;
	}

	.circle-stats {
		padding: 1rem;

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.8rem 1rem;
		}
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