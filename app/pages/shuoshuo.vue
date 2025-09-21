<script setup lang="ts">
interface ShuoItemImage {
	id?: number
	image_source?: string
	image_url?: string
	message_id?: number
}

interface ShuoItem {
	id: number
	content: string
	username?: string
	private?: boolean
	user_id?: number
	fav_count?: number
	created_at?: string
	images?: ShuoItemImage[]
}

interface ShuoResponse {
	total: number
	items: ShuoItem[]
}

const appConfig = useAppConfig()
const route = useRoute()
const router = useRouter()
const initialNow = useInitialNow()

// 侧边栏配置（与主页风格接近）
const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'latest-comments'])

const page = ref(Number(route.query.page || 1))
const pageSize = 20

const { data, pending, error } = await useFetch<ShuoResponse>(
	() => `/api/shuoshuo`,
	{
		query: () => ({ page: page.value, pageSize }),
		key: () => `shuoshuo-${page.value}-${pageSize}`,
		// SSR 首屏预取，后续 page 变化在客户端再次获取
		watch: [page],
		default: () => ({ total: 0, items: [] }),
	},
)

const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total || 0) / pageSize)))

watch(page, (val) => {
	// 同步到 URL 查询参数，确保可分享/回退
	router.replace({ query: { ...route.query, page: val > 1 ? String(val) : undefined } })
})

useSeoMeta({
	title: computed(() => (page.value > 1 ? `说说 - 第${page.value}页` : '说说')),
	description: `${appConfig.title} 的即刻想法/碎碎念。基于 Ech0 提供的数据源。`,
})

function formatShuoTime(value?: string) {
	if (!value)
		return ''
	try {
		return getPostDate(value, initialNow.value)
	}
	catch {
		return ''
	}
}
</script>

<template>
<div class="shuoshuo">
	<div class="mobile-only">
		<ZhiluHeader to="/" suffix="说说" />
	</div>

	<!-- 加载状态 -->
	<div v-if="pending" class="shuo-loading" aria-busy="true" aria-live="polite">
		<div class="skeleton-list">
			<div v-for="i in 4" :key="i" class="skeleton-item card">
				<div class="skeleton-line skeleton-time" />
				<div class="skeleton-line skeleton-content" />
				<div class="skeleton-line skeleton-content short" />
			</div>
		</div>
	</div>

	<!-- 错误状态 -->
	<div v-else-if="error" class="shuo-error">
		<ZError>
			<template #title>
				加载失败
			</template>
			<template #description>
				无法获取说说数据，可能是网络原因。
				<br>
				<span class="error-detail">{{ error.message }}</span>
			</template>
		</ZError>
	</div>

	<!-- 正常内容 -->
	<div v-else class="shuo-list">
		<div v-if="!data?.items?.length" class="shuo-empty">
			<ZError>
				<template #title>
					暂无说说
				</template>
				<template #description>
					还没有发布内容
				</template>
			</ZError>
		</div>

		<TransitionGroup v-else appear name="float-in">
			<article v-for="(item, index) in data?.items" :key="item.id" class="shuo-item card" :style="{ '--delay': `${index * 0.05}s` }">
				<header class="shuo-meta">
					<span class="author">{{ item.username || '匿名' }}</span>
					<time class="time">{{ formatShuoTime(item.created_at) }}</time>
					<span v-if="typeof item.fav_count === 'number'" class="likes">
						<Icon name="ph:thumbs-up" /> {{ item.fav_count }}
					</span>
				</header>

				<div class="shuo-content" v-text="item.content" />

				<div v-if="item.images?.length" class="shuo-images">
					<NuxtImg
						v-for="(img, idx) in item.images"
						:key="idx"
						:src="img.image_url"
						:alt="`图片 ${idx + 1}`"
						loading="lazy"
						decoding="async"
						sizes="(max-width: 768px) 33vw, 240px"
						class="shuo-image"
					/>
				</div>
			</article>
		</TransitionGroup>

		<ZPagination v-model="page" :total-pages="totalPages" />
	</div>
</div>
</template>

<style lang="scss" scoped>
.shuoshuo {
	margin: 1rem;
}

.shuo-list {
	display: grid;
	gap: 1rem;
}

.shuo-item {
	padding: 1rem;
}

.shuo-meta {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.5rem;
	font-size: 0.9rem;
	color: var(--c-text-2);

	.author {
		font-weight: 600;
		color: var(--c-text-1);
	}

	.time {
		margin-left: auto;
	}

	.likes {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--c-text-2);
	}
}

.shuo-content {
	line-height: 1.8;
	white-space: pre-wrap;
}

.shuo-images {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	gap: 0.5rem;
	margin-top: 0.5rem;

	.shuo-image {
		width: 100%;
		height: 100%;
		border-radius: 0.5rem;
		object-fit: cover;
	}
}

// 骨架屏
.skeleton-list {
	display: grid;
	gap: 1rem;
}
.skeleton-item { padding: 1rem; }

.skeleton-line {
	height: 0.9rem;
	border-radius: 0.4rem;
	background: var(--c-bg-mute);

	&.skeleton-time {
		width: 30%;
		margin-bottom: 0.6rem;
	}

	&.skeleton-content {
		width: 100%;
		margin: 0.4rem 0;
	}
	&.short { width: 70%; }
}
</style>
