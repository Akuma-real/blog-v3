<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log', 'comm-group'])

const appConfig = useAppConfig()
const runtime = useRuntimeConfig()

const title = '朋友圈'
const description = '发现更多有趣的博主。'
useSeoMeta({ title, description })

// 配置选项（仅分页大小）
const UserConfig = reactive({
	page_size: Number(runtime.public.fcirclePageSize || 20),
})

// 状态管理
const allArticles = ref<{ id: string, title: string, link: string, author: string, created: string, avatar: string }[]>([])
const displayCount = ref(UserConfig.page_size)
const isLoading = ref(true)
const randomArticle = ref<any>(null)
const showAvatarPopup = ref(false)
const selectedAuthor = ref('')
const selectedAuthorAvatar = ref('')
const selectedArticleLink = ref('')
const articlesByAuthor = ref<Record<string, any[]>>({})
const lastUpdatedDate = ref('')
const loadError = ref<string | null>(null)

// 计算属性
const displayedArticles = computed(() => allArticles.value.slice(0, displayCount.value))
const hasMoreArticles = computed(() => allArticles.value.length > displayCount.value)

// 格式化日期
function formatDate(dateString?: string) {
	if (!dateString)
		return ''
	const date = new Date(dateString)
	if (Number.isNaN(date.getTime()))
		return ''
	return date
		.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
		.replace(/\//g, '-')
}

// 刷新随机文章
function refreshRandomArticle() {
	if (allArticles.value.length > 0) {
		const randomIndex = Math.floor(Math.random() * allArticles.value.length)
		randomArticle.value = allArticles.value[randomIndex]
	}
}

// 加载更多
function loadMore() {
	displayCount.value += UserConfig.page_size
}

// 模态框相关
function showAvatarPosts(author: string, avatar: string, articleLink: string) {
	selectedAuthor.value = author
	selectedAuthorAvatar.value = avatar
	selectedArticleLink.value = articleLink
	showAvatarPopup.value = true
}

function closeAvatarPopup() {
	showAvatarPopup.value = false
}

// 监听点击外部关闭弹窗
function handleClickOutside(event: MouseEvent) {
	const popup = document.getElementById('avatar-popup')
	if (popup && !popup.contains(event.target as Node) && showAvatarPopup.value) {
		closeAvatarPopup()
	}
}

// 固定数据源（只从 data.json 获取）
const API_URL = 'https://circle-api.june.ink/data.json'

// 获取数据
async function fetchData() {
	try {
		isLoading.value = true
		loadError.value = null

		const res = await fetch(API_URL, { cache: 'no-store' })
		if (!res.ok)
			throw new Error(`${res.status} ${res.statusText}`)
		const raw: any = await res.json()

		// 优先 posts，其次兼容 article_data/data.article_data/items
		const articleData: any[]
			= (Array.isArray(raw?.posts) && raw.posts)
				|| (Array.isArray(raw?.article_data) && raw.article_data)
				|| (Array.isArray(raw?.data?.article_data) && raw.data.article_data)
				|| (Array.isArray(raw?.items) && raw.items)
				|| []

		const lastUpdated: string | undefined = raw?.stats?.updated_at
			|| raw?.statistical_data?.last_updated_time
			|| raw?.last_updated_time

		// 处理数据
		allArticles.value = (articleData || []).map((item, i) => ({
			id: String(item.id || `${item.link || i}-${i}`),
			title: String(item.title || ''),
			link: String(item.link || ''),
			author: String(item.author || item.name || ''),
			created: String(item.created || item.created_at || item.updated || ''),
			avatar: String(item.avatar || ''),
		}))

		// 按作者分组（兼容 noUncheckedIndexedAccess）
		articlesByAuthor.value = allArticles.value.reduce<Record<string, any[]>>((acc, article) => {
			const key = article.author || ''
			const list = acc[key] ?? (acc[key] = [])
			list.push(article)
			return acc
		}, {})

		// 初始化随机文章
		refreshRandomArticle()

		// 设置最新更新日期
		if (allArticles.value.length > 0) {
			const sortedArticles = [...allArticles.value].sort((a, b) => +new Date(b.created) - +new Date(a.created))
			lastUpdatedDate.value = formatDate(sortedArticles[0]?.created) || formatDate(lastUpdated)
		}
		else if (lastUpdated) {
			lastUpdatedDate.value = formatDate(lastUpdated)
		}
	}
	catch (error: any) {
		loadError.value = String(error?.message || error)

		console.error('加载文章失败:', error)
	}
	finally {
		isLoading.value = false
	}
}

// 生命周期钩子
onMounted(() => {
	document.addEventListener('click', handleClickOutside)
	fetchData()
})

onUnmounted(() => {
	document.removeEventListener('click', handleClickOutside)
})

// 已选择作者的文章列表（避免模板中可选链 TS 警告）
const selectedArticles = computed(() => {
	const key = selectedAuthor.value
	return (key && articlesByAuthor.value[key]) ? articlesByAuthor.value[key] : []
})
</script>

<template>
<div class="page-fcircle">
	<div class="mobile-only">
		<ZhiluHeader to="/" suffix="朋友圈" />
	</div>

	<!-- 简易 Banner -->
	<header class="banner gradient-card">
		<div class="banner-text">
			<h1 class="banner-title">
				{{ title }}
			</h1>
			<p class="banner-desc">
				{{ description || appConfig.subtitle }}
			</p>
		</div>
		<div class="fcircle-stats">
			<div class="fcircle-stats-update-time">
				Updated at {{ lastUpdatedDate || '—' }}
			</div>
			<div class="fcircle-stats-powered-by">
				Powered by FriendCircleLite
			</div>
		</div>
	</header>

	<div class="fcircle">
		<!-- 加载/错误 -->
		<div v-if="isLoading" class="error-container" aria-busy="true">
			<Icon class="error-container-icon" name="ph:timer-bold" />
			<p>加载中…</p>
		</div>
		<div v-else-if="loadError" class="error-container">
			<Icon class="error-container-icon" name="ph:warning-circle-bold" />
			<p>加载失败</p>
			<p class="empty-hint">
				{{ loadError }}
			</p>
		</div>

		<!-- 随机文章区域 -->
		<div v-else-if="randomArticle" class="fcircle-random-article">
			<div class="fcircle-random-title">
				随机文章
			</div>
			<div class="article-item">
				<a :href="randomArticle.link" target="_blank" rel="noopener noreferrer" class="article-item-container gradient-card">
					<span class="article-item-author">{{ randomArticle.author }}</span>
					<span class="article-item-title">{{ randomArticle.title }}</span>
					<span class="article-item-date">{{ formatDate(randomArticle.created) }}</span>
				</a>
			</div>
			<ZButton class="btn-refresh gradient-card" icon="uim:process" @click="refreshRandomArticle" />
		</div>

		<!-- 文章列表区域 -->
		<div v-if="!isLoading" class="fcircle-articles">
			<div
				v-for="(article, index) in displayedArticles"
				:key="article.id"
				class="article-item article-item-new"
				:style="{ '--delay': `${(index % UserConfig.page_size) * 0.05}s` }"
			>
				<div class="article-item-image" @click="showAvatarPosts(article.author, article.avatar, article.link)">
					<NuxtImg :src="article.avatar" :alt="article.author" loading="lazy" />
				</div>
				<a :href="article.link" target="_blank" rel="noopener noreferrer" class="article-item-container gradient-card">
					<span class="article-item-author">{{ article.author }}</span>
					<span class="article-item-title">{{ article.title }}</span>
					<span class="article-item-date">{{ formatDate(article.created) }}</span>
				</a>
			</div>
		</div>

		<!-- 加载更多按钮 -->
		<ZButton v-show="hasMoreArticles" class="btn-load-more gradient-card" text="加载更多" @click="loadMore" />

		<!-- 空状态 -->
		<div v-if="!isLoading && allArticles.length === 0 && !loadError" class="error-container">
			<Icon class="error-container-icon" name="ph:file-text-bold" />
			<p>暂无文章数据</p>
			<p class="empty-hint">
				请稍后再试
			</p>
		</div>

		<!-- 作者模态框 - 时间线样式 -->
		<Transition name="modal">
			<div v-if="showAvatarPopup && selectedAuthor && articlesByAuthor[selectedAuthor]" id="avatar-popup" class="modal" @click="closeAvatarPopup">
				<div class="modal-content" @click.stop>
					<div class="modal-header">
						<NuxtImg :src="selectedAuthorAvatar" :alt="selectedAuthor" loading="lazy" class="modal-avatar-img" />
						<h3>{{ selectedAuthor }}</h3>
						<a :href="selectedArticleLink" target="_blank" rel="noopener noreferrer" class="modal-author-link">
							<Icon name="lucide:external-link" />
						</a>
					</div>
					<div class="modal-body">
						<div class="timeline">
							<div v-for="(article, index) in selectedArticles.slice(0, 10)" :key="article.id" class="timeline-item" :style="{ '--delay': `${0.2 + index * 0.1}s` }">
								<span class="timeline-date">{{ formatDate(article.created) }}</span>
								<a :href="article.link" target="_blank" rel="noopener noreferrer" class="timeline-title" @click="closeAvatarPopup">{{ article.title }}</a>
							</div>
						</div>
					</div>
					<div class="modal-avatar">
						<NuxtImg :src="selectedAuthorAvatar" :alt="selectedAuthor" loading="lazy" />
					</div>
				</div>
			</div>
		</Transition>
	</div>
</div>
</template>

<style lang="scss" scoped>
/* 主要样式 */
.page-fcircle {
	margin: 1rem;
	animation: float-in 0.2s backwards;
}

.banner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
	padding: 1rem;
	border: 1px solid var(--c-border);
	background: var(--c-bg-card);

	.banner-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.banner-desc {
		margin: 0.25rem 0 0;
		color: var(--c-text-2);
	}
}

.fcircle-stats {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 0.1rem;
	font-family: var(--font-monospace);
	font-size: 0.75rem;
	color: var(--c-text-3);

	.fcircle-stats-update-time { opacity: 1; }
	.fcircle-stats-powered-by { opacity: 0.9; }
}

.fcircle {
	.fcircle-random-article {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin: 1rem 0;

		.fcircle-random-title {
			font-size: 1.2rem;
			white-space: nowrap;
		}

		.article-item {
			flex: 1;
			min-width: 0;
		}

		.article-item-container .article-item-title {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	.fcircle-articles {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
}

/* 文章项样式 */
.article-item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
}

.article-item.article-item-new { animation: float-in 0.2s var(--delay) backwards; }

.article-item-image {
	display: flex;
	flex-shrink: 0;
	overflow: hidden;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	box-shadow: 0 0 0 1px var(--c-bg-soft);
}

.article-item-image img {
	opacity: 0.8;
	width: 100%;
	height: 100%;
	transition: all 0.2s;
	object-fit: cover;
}

.article-item-container {
	display: flex;
	align-items: center;
	gap: 5px;
	width: 100%;
	height: 2.5rem;
	padding: 0 0.75rem;
	border-radius: 8px;
	box-shadow: 0 0 0 1px var(--c-bg-soft);
}

.article-item-author {
	font-weight: 500;
	white-space: nowrap;
	color: var(--c-text-2);
}

.article-item-title {
	flex: 1 1 auto;
	min-width: 0;
	color: var(--c-text-1);
}

.article-item-date {
	font-family: var(--font-monospace);
	white-space: nowrap;
	color: var(--c-text-3);
}

/* 操作按钮 */
.btn-load-more,
.btn-refresh {
	height: 2.5rem;
}

.btn-load-more {
	display: block;
	width: 8rem;
	margin: 0.5rem 0 0 auto;
}

/* 错误/空状态 */
.error-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	height: 280px;
	color: var(--c-text-2);
}

.error-container-icon { font-size: 3rem; }
.empty-hint { color: var(--c-text-3); }

/* 模态框 */
.modal {
	display: flex;
	align-items: center;
	justify-content: center;
	position: fixed;
	inset: 0;
	background-color: rgb(0 0 0 / 40%);
	z-index: 1000;
}

.modal-content {
	position: relative;
	overflow: hidden;
	width: min(720px, 92vw);
	max-height: 80vh;
	border: 1px solid var(--c-border);
	border-radius: 12px;
	box-shadow: 0 10px 30px rgb(0 0 0 / 20%);
	background: var(--c-bg-card);
}

.modal-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	position: sticky;
	top: 0;
	padding: 0.75rem 1rem;
	border-bottom: 1px dashed var(--c-bg-soft);
	background: inherit;
	z-index: 2;
}

.modal-avatar-img {
	width: 28px;
	height: 28px;
	border-radius: 50%;
}

.modal-author-link {
	margin-left: auto;
	color: var(--c-text-2);
}

.modal-body {
	position: relative;
	padding: 1rem;
}

.timeline {
	position: relative;
	padding-left: 1rem;
}

.timeline::after {
	content: "";
	position: absolute;
	top: 0.5rem;
	bottom: 1rem;
	left: 0.5rem;
	width: 2px;
	background: var(--c-bg-soft);
	transform: translate(-50%);
}

.timeline-item {
	position: relative;
	padding: 0 0 1rem 1.25rem;
	color: var(--c-text-2);
	animation: float-in 0.3s var(--delay) backwards;
}

.timeline-item::before {
	content: "";
	position: absolute;
	top: 0.5rem;
	left: 0.25rem;
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 50%;
	background-color: var(--c-text-2);
	transform: translateY(-50%) translate(-50%);
	transition: transform 0.3s ease, box-shadow 0.3s ease;
	z-index: 1;
}

.timeline-item:hover::before {
	box-shadow: 0 0 8px var(--c-text-2);
	transform: translateY(-50%) translate(-50%) scale(1.5);
}

.timeline-date {
	display: block;
	margin-bottom: 0.3rem;
	font-family: var(--font-monospace);
	font-size: 0.875rem;
	color: var(--c-text-3);
}

.timeline-title {
	line-height: 1.4;
	color: var(--c-text-2);
	transition: color 0.3s;
}

.timeline-title:hover { color: var(--c-text); }

.modal-avatar {
	position: absolute;
	overflow: hidden;
	opacity: 0.6;
	right: 1.25rem;
	bottom: 1.25rem;
	width: 128px;
	height: 128px;
	border-radius: 50%;
	filter: blur(5px);
	pointer-events: none;
	z-index: 1;
}

.modal-avatar img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

/* 模态框过渡 */
.modal-enter-active,
.modal-enter-active .modal-content,
.modal-leave-active,
.modal-leave-active .modal-content {
	transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to { opacity: 0; }

.modal-enter-from .modal-content,
.modal-leave-to .modal-content { transform: translateY(-20px); }

.modal-enter-to,
.modal-leave-from { opacity: 1; }

.modal-enter-to .modal-content,
.modal-leave-from .modal-content { transform: translateY(0); }

/* 移动端适配 */
@media (max-width: 768px) {
	.fcircle-random-article .fcircle-random-title {
		display: none;
	}

	.page-fcircle .article-item .article-item-container {
		flex-wrap: wrap;
		height: auto;
	}

	.page-fcircle .article-item .article-item-container .article-item-author {
		flex-grow: 1;
	}

	.page-fcircle .article-item .article-item-container .article-item-title {
		flex-basis: 100%;
		order: 3;
		white-space: normal;
	}
}
</style>
