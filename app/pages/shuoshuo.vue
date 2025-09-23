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
	extension?: string
	extension_type?: string
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

function getNeteaseEmbed(url?: string) {
	if (!url)
		return ''
	try {
		const normalized = url.replace('#/', '/')
		const parsed = new URL(normalized.startsWith('http') ? normalized : `https://music.163.com${normalized}`)
		const id = parsed.searchParams.get('id')
		return id ? `https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66` : ''
	}
	catch {
		return ''
	}
}

// ========== meting-js / APlayer 集成 ==========
const METING_API = 'https://meting.qjqq.cn/?server=:server&type=:type&id=:id'
const aplayerReady = ref(false)

function addLinkOnce(id: string, href: string) {
	if (document.getElementById(id)) return
	const link = document.createElement('link')
	link.id = id
	link.rel = 'stylesheet'
	link.href = href
	document.head.appendChild(link)
}

function loadScriptOnce(id: string, src: string) {
	return new Promise<void>((resolve, reject) => {
		const existed = document.getElementById(id) as HTMLScriptElement | null
		if (existed) {
			if ((existed as any)._loaded) return resolve()
			existed.addEventListener('load', () => resolve())
			existed.addEventListener('error', () => reject(new Error(`load fail: ${src}`)))
			return
		}
		const s = document.createElement('script')
		s.id = id
		s.src = src
		s.defer = true
		;(s as any)._loaded = false
		s.onload = () => { (s as any)._loaded = true; resolve() }
		s.onerror = () => reject(new Error(`load fail: ${src}`))
		document.body.appendChild(s)
	})
}

async function ensureMetingAssets() {
	if (!import.meta.client) return
	const cssCdnList = [
		'https://cdn.staticfile.org/aplayer/1.10.1/APlayer.min.css',
		'https://unpkg.com/aplayer/dist/APlayer.min.css',
		'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css',
	]
	const jsAPlayerList = [
		'https://cdn.staticfile.org/aplayer/1.10.1/APlayer.min.js',
		'https://unpkg.com/aplayer/dist/APlayer.min.js',
		'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js',
	]
	const jsMetingList = [
		'https://cdn.staticfile.org/meting/2.0.1/Meting.min.js',
		'https://unpkg.com/meting@2/dist/Meting.min.js',
		'https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js',
	]
	async function tryList(id: string, list: string[], isCss = false) {
		for (const url of list) {
			try {
				if (isCss) addLinkOnce(id, url)
				else await loadScriptOnce(id, url)
				return true
			}
			catch (e) {
				console.warn(`[meting] 资源加载失败，尝试下一个: ${url}`, e)
			}
		}
		return false
	}
	const cssOk = await tryList('aplayer-css', cssCdnList, true)
	const js1Ok = await tryList('aplayer-js', jsAPlayerList)
	const js2Ok = await tryList('meting-js', jsMetingList)
	aplayerReady.value = cssOk && js1Ok && js2Ok
	if (!aplayerReady.value)
		console.error('[meting] 资源加载失败（全部CDN不可用）')
}

onMounted(() => {
	ensureMetingAssets()
})

// 解析音乐分享链接 → { server, type, id }
function parseMusicURL(url?: string): { server: string; type: string; id: string } | null {
	if (!url) return null
	try {
		const normalized = url.replace('#/', '/')
		const u = new URL(normalized.startsWith('http') ? normalized : `https:${normalized.startsWith('//') ? normalized : '//' + normalized}`)
		const h = u.hostname
		const p = u.pathname
		// 网易云
		if (h.includes('music.163.com')) {
			let type = 'song'
			if (p.includes('/playlist')) type = 'playlist'
			else if (p.includes('/album')) type = 'album'
			const id = u.searchParams.get('id') || ''
			return id ? { server: 'netease', type, id } : null
		}
		// QQ 音乐（简易识别）
		if (h.includes('y.qq.com') || h.includes('qq.com')) {
			let id = u.searchParams.get('songmid') || ''
			if (!id) {
				const m = p.match(/songDetail\/([\w]+)/i) || p.match(/song\/([\w]+)/i)
				if (m) id = m[1]
			}
			return id ? { server: 'tencent', type: 'song', id } : null
		}
		// 裸数字 → 默认按网易云单曲
		if (/^\d+$/.test(url)) return { server: 'netease', type: 'song', id: url }
		return null
	}
	catch {
		// 非URL或无法解析，允许裸数字兜底
		if (/^\d+$/.test(url)) return { server: 'netease', type: 'song', id: url }
		return null
	}
}

// 判定 B 站链接或 ID（支持 BV/av、b23 短链、bilibili 域名）
function isBilibili(type?: string, ext?: string) {
	if (!ext)
		return false
	const t = String(type || '').toUpperCase()
	if (t.includes('BILI'))
		return true
	const s = ext.trim()
	const lower = s.toLowerCase()
	return lower.includes('bilibili.com')
		|| lower.includes('b23.tv')
		|| /^bv[0-9a-z]{10,}$/i.test(s)
		|| /^av\d+$/i.test(s)
}

// 规范化 B 站外链（将 BV/av 裸 ID 转为可访问链接）
function normalizeBiliUrl(s: string) {
	if (!s)
		return ''
	if (/^https?:\/\//i.test(s))
		return s
	if (s.startsWith('www.') || s.includes('bilibili.com') || s.includes('b23.tv'))
		return `https://${s}`
	if (/^bv[0-9a-z]{10,}$/i.test(s) || /^av\d+$/i.test(s))
		return `https://www.bilibili.com/video/${s}`
	return s
}

// 生成 B 站播放器 iframe 源地址（优先 bvid，其次 aid）
function getBilibiliEmbed(ext?: string) {
	if (!ext)
		return ''
	const s = ext.trim()
	let bvid = ''
	let aid = ''
	if (/^bv[0-9a-z]{10,}$/i.test(s)) {
		bvid = s
	}
	else if (/^av\d+$/i.test(s)) {
		aid = s.replace(/[^0-9]/g, '')
	}
	else {
		try {
			const u = new URL(normalizeBiliUrl(s))
			const path = u.pathname
			const mBV = path.match(/\/BV([0-9A-Za-z]+)/i)
			if (mBV)
				bvid = `BV${mBV[1]}`
			const mAV = path.match(/\/av(\d+)/i)
			if (mAV)
				aid = mAV[1]
		}
		catch {
			// 忽略解析错误
		}
	}
	if (bvid)
		// 参考 Ech0 前端：使用移动端黑板播放器，减少跳转与边距
		return `https://www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${bvid}&as_wide=1&high_quality=1&danmaku=0`
	if (aid)
		return `https://player.bilibili.com/player.html?aid=${aid}&autoplay=0&high_quality=1&danmaku=0`
	return ''
}

// 规范化扩展外链用于 a.href，避免 BV 裸 ID 被当作站内相对路径
function formatExtensionUrl(ext?: string, type?: string) {
	if (!ext)
		return ''
	if (isBilibili(type, ext))
		return normalizeBiliUrl(ext)
	if (/^https?:\/\//i.test(ext))
		return ext
	// 其他情况做保守处理：含点号视为域名拼接 https
	if (/[.]/.test(ext))
		return `https://${ext}`
	return ext
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

				<!-- 音乐扩展（APlayer / meting-js） -->
				<div v-if="item.extension_type === 'MUSIC' && item.extension" class="shuo-music">
					<div v-if="aplayerReady && parseMusicURL(item.extension)">
						<meting-js
							:api="METING_API"
							:server="parseMusicURL(item.extension)!.server"
							:type="parseMusicURL(item.extension)!.type"
							:id="parseMusicURL(item.extension)!.id"
							preload="none"
							fixed="false"
							loop="none"
							order="list"
							mini="false"
						/>
					</div>
					<div v-else>
						<!-- Fallback：网易云外链播放器，避免空白 -->
						<iframe
							:title="`音乐 ${item.id}`"
							:src="getNeteaseEmbed(item.extension)"
							width="100%"
							height="86"
							frameborder="0"
							allow="autoplay; encrypted-media"
						></iframe>
					</div>
				</div>

				<!-- B 站视频扩展 -->
				<div v-else-if="isBilibili(item.extension_type, item.extension)" class="shuo-bilibili">
					<iframe
						:title="`哔哩哔哩 ${item.id}`"
						:src="getBilibiliEmbed(item.extension)"
						width="100%"
						height="100%"
						frameborder="0"
						allow="autoplay; encrypted-media"
						allowfullscreen
					></iframe>
				</div>

				<!-- 单图扩展（当 images 为空时兜底） -->
				<div v-else-if="item.extension_type === 'IMAGE' && item.extension && !item.images?.length" class="shuo-images">
					<NuxtImg :src="item.extension" alt="图片" loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 320px" class="shuo-image" />
				</div>

				<!-- 其他扩展统一展示为外链 -->
				<div v-else-if="item.extension" class="shuo-extension">
					<a :href="formatExtensionUrl(item.extension, item.extension_type)" target="_blank" rel="noopener noreferrer" class="shuo-link">查看附加内容</a>
				</div>

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

.shuo-music {
	margin-top: 0.5rem;
	border-radius: 0.5rem;
	overflow: hidden;
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

.shuo-extension { margin-top: 0.5rem; }
.shuo-link { color: var(--c-brand); text-decoration: underline; }
.shuo-bilibili { margin-top: 0.5rem; border-radius: 0.5rem; overflow: hidden; aspect-ratio: 16 / 9; }
.shuo-bilibili iframe { width: 100%; height: 100%; display: block; }

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
