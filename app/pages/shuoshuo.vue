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

// 改为仅在客户端获取，避免 SSG 构建期固化数据
const { data, pending, error, refresh } = useFetch<ShuoResponse>(
	() => `/api/shuoshuo`,
	{
		query: () => ({ page: page.value, pageSize }),
		key: () => `shuoshuo-${page.value}-${pageSize}`,
		server: false,
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
		return id ? `https://music.163.com/m/outchain/player?type=2&id=${id}&auto=0&height=66` : ''
	}
	catch {
		return ''
	}
}

// ========== meting-js / APlayer 集成 ==========
const METING_API = 'https://meting.qjqq.cn/?server=:server&type=:type&id=:id'
const aplayerReady = ref(false)

function addLinkOnce(id: string, href: string) {
	if (document.getElementById(id))
		return
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
			if ((existed as any)._loaded)
				return resolve()
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
	if (!import.meta.client)
		return
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
				if (isCss)
					addLinkOnce(id, url)
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
function parseMusicURL(url?: string): { server: string, type: string, id: string } | null {
	if (!url)
		return null
	try {
		const normalized = url.replace('#/', '/')
		const u = new URL(normalized.startsWith('http') ? normalized : `https:${normalized.startsWith('//') ? normalized : `//${normalized}`}`)
		const h = u.hostname
		const p = u.pathname
		// 网易云
		if (h.includes('music.163.com')) {
			let type = 'song'
			if (p.includes('/playlist'))
				type = 'playlist'
			else if (p.includes('/album'))
				type = 'album'
			const id = u.searchParams.get('id') || ''
			return id ? { server: 'netease', type, id } : null
		}
		// QQ 音乐（简易识别）
		if (h.includes('y.qq.com') || h.includes('qq.com')) {
			let id = u.searchParams.get('songmid') || ''
			if (!id) {
				const m = p.match(/songDetail\/(\w+)/i) || p.match(/song\/(\w+)/i)
				if (m)
					id = m[1]
			}
			return id ? { server: 'tencent', type: 'song', id } : null
		}
		// 裸数字 → 默认按网易云单曲
		if (/^\d+$/.test(url || ''))
			return { server: 'netease', type: 'song', id: url }
		return null
	}
	catch {
		// 非URL或无法解析，允许裸数字兜底
		if (/^\d+$/.test(url || ''))
			return { server: 'netease', type: 'song', id: url }
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
		aid = s.replace(/\D/g, '')
	}
	else {
		try {
			const u = new URL(normalizeBiliUrl(s))
			const path = u.pathname
			const mBV = path.match(/\/BV([0-9A-Z]+)/i)
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
	const e = ext as string
	if (isBilibili(type, e))
		return normalizeBiliUrl(e)
	if (/^https?:\/\//i.test(e))
		return e
	// 其他情况做保守处理：含点号视为域名拼接 https
	if (/\./.test(e))
		return `https://${e}`
	return e
}

// ========== GitHub 仓库分享扩展 ==========
function parseGithubRepo(raw?: string): { owner: string, repo: string } | null {
	if (!raw)
		return null
	const s = raw.trim()
	// 裸 owner/repo
	const bare = s.match(/^[\w.-]+\/[\w.-]+$/)
	if (bare) {
		const [owner, repo] = s.split('/')
		return { owner, repo }
	}
	try {
		const u = new URL(s.startsWith('http') ? s : `https://${s}`)
		const host = u.hostname.replace(/^www\./, '')
		if (host !== 'github.com')
			return null
		const parts = u.pathname.split('/').filter(Boolean)
		if (parts.length >= 2)
			return { owner: parts[0], repo: parts[1] }
		return null
	}
	catch {
		return null
	}
}

function isGithubRepo(raw?: string) {
	return parseGithubRepo(raw) != null
}

function toGithubRepoUrl(raw?: string) {
	const pr = parseGithubRepo(raw)
	return pr ? `https://github.com/${pr.owner}/${pr.repo}` : formatExtensionUrl(raw)
}

function getGithubOgImage(raw?: string) {
	const pr = parseGithubRepo(raw)
	return pr ? `https://opengraph.githubassets.com/1/${pr.owner}/${pr.repo}` : ''
}
</script>

<template>
<div class="shuoshuo">
	<!-- 页面横幅 -->
	<div class="page-banner">
		<div class="banner-content">
			<h1>说说</h1>
			<p>记录生活点滴，分享即时想法</p>
		</div>
		<div class="banner-extra">
			<div class="shuo-stats">
				<div class="powered-by">
					Powered by Ech0
				</div>
				<div v-if="data?.total" class="shuo-count">
					共 {{ data.total }} 条说说
				</div>
			</div>
		</div>
	</div>

	<div class="mobile-only">
		<ZhiluHeader to="/" suffix="说说" />
	</div>

	<ClientOnly>
		<!-- 说说内容区域 - 完全匹配essay页面结构 -->
		<div class="page-essay">
			<div class="talk-container">
				<!-- 加载状态 - 匹配essay页面样式 -->
				<div v-if="pending" class="loading-container">
					<div class="loading-spinner" />
					<p>加载中...</p>
				</div>
				<!-- 错误状态 -->
				<div v-else-if="error" class="loading-container">
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

				<!-- 正常内容 - 使用卡片式布局 -->
				<div v-else-if="data?.items?.length" class="feed-list">
					<TransitionGroup appear name="float-in">
						<article v-for="(item, index) in data?.items" :key="item.id" class="post-card" :style="{ '--delay': `${index * 0.05}s` }">
							<div class="post-content">
								<!-- 头部区域：头像 + 博主信息 -->
								<div class="post-header">
									<a href="/about" class="avatar-link">
										<NuxtImg :src="(appConfig.author?.avatar as string)" alt="头像" class="avatar" width="48" height="48" />
									</a>
									<div class="post-meta">
										<a href="/about" class="author-name">{{ appConfig.author?.name || '匿名' }}</a>
										<div class="post-time">
											<time>{{ formatShuoTime(item.created_at) }}</time>
											<span v-if="item.fav_count != null" class="likes">
												<Icon name="ph:thumbs-up" /> {{ Number(item.fav_count) }}
											</span>
										</div>
									</div>
								</div>

								<!-- 内容区域 -->
								<div class="post-body">
									<p class="post-text" v-text="item.content" />

									<!-- 音乐扩展（APlayer / meting-js） -->
									<div v-if="item.extension_type === 'MUSIC' && item.extension" class="post-music">
										<div v-if="aplayerReady && parseMusicURL(item.extension)">
											<meting-js
												:id="parseMusicURL(item.extension)!.id"
												:api="METING_API"
												:server="parseMusicURL(item.extension)!.server"
												:type="parseMusicURL(item.extension)!.type"
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
											/>
										</div>
									</div>

									<!-- B 站视频扩展 -->
									<div v-else-if="isBilibili(item.extension_type, item.extension)" class="post-bilibili">
										<iframe
											:title="`哔哩哔哩 ${item.id}`"
											:src="getBilibiliEmbed(item.extension)"
											width="100%"
											height="100%"
											frameborder="0"
											allow="autoplay; encrypted-media"
											allowfullscreen
										/>
									</div>

									<!-- GitHub 仓库扩展（显示 OpenGraph 卡片） -->
									<div v-else-if="isGithubRepo(item.extension)" class="post-github">
										<a :href="toGithubRepoUrl(item.extension)" target="_blank" rel="noopener noreferrer" class="post-link">
											<img :src="getGithubOgImage(item.extension)" alt="GitHub 项目" loading="lazy" decoding="async" class="post-github-og">
										</a>
									</div>

									<!-- 单图扩展（当 images 为空时兜底） -->
									<div v-else-if="item.extension_type === 'IMAGE' && item.extension && !item.images?.length" class="post-images">
										<NuxtImg :src="(item.extension as string)" alt="图片" loading="lazy" decoding="async" sizes="(max-width: 768px) 50vw, 320px" class="post-image" />
									</div>

									<!-- 其他扩展统一展示为外链 -->
									<div v-else-if="item.extension" class="post-extension">
										<a :href="formatExtensionUrl(item.extension, item.extension_type)" target="_blank" rel="noopener noreferrer" class="post-link">查看附加内容</a>
									</div>

									<!-- 多图显示 -->
									<div v-if="item.images?.length" class="post-images">
										<NuxtImg
											v-for="(img, idx) in item.images"
											:key="idx"
											:src="(img.image_url as string)"
											:alt="`图片 ${idx + 1}`"
											loading="lazy"
											decoding="async"
											sizes="(max-width: 768px) 33vw, 240px"
											class="post-image"
										/>
									</div>
								</div>
							</div>
						</article>
					</TransitionGroup>
				</div>

				<!-- 空状态 -->
				<div v-else class="loading-container">
					<ZError>
						<template #title>
							暂无说说
						</template>
						<template #description>
							还没有发布内容
						</template>
					</ZError>
				</div>
			</div>

			<!-- 分页 -->
			<div v-if="data?.items?.length" class="pagination-container">
				<ZPagination v-model="page" :total-pages="totalPages" />
			</div>
		</div>
	</ClientOnly>
</div>
</template>

<style lang="scss" scoped>
.shuoshuo {
	margin: 1rem;
}

// 页面横幅样式
.page-banner {
	position: relative;
	overflow: hidden;
	margin-bottom: 1.5rem;
	padding: 2rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, var(--c-brand-soft, rgb(59 130 246 / 10%)) 0%, var(--c-bg-mute) 100%);

	// 添加微妙的渐变效果
	&::before {
		content: "";
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 20% 80%, rgb(59 130 246 / 10%) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgb(139 92 246 / 10%) 0%, transparent 50%);
		pointer-events: none;
	}
}

.banner-content {
	position: relative;
	text-align: center;
	z-index: 1;

	h1 {
		margin: 0 0 0.5rem;
		background: linear-gradient(135deg, var(--c-brand), var(--c-brand-2, #8B5CF6));
		background-clip: text;
		font-size: 2rem;
		font-weight: 700;
		color: var(--c-text-1);
		-webkit-text-fill-color: transparent;
	}

	p {
		opacity: 0.8;
		margin: 0;
		font-size: 1rem;
		color: var(--c-text-2);
	}
}

.banner-extra {
	display: flex;
	justify-content: center;
	position: relative;
	margin-top: 1rem;
	z-index: 1;
}

.shuo-stats {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.875rem;
	color: var(--c-text-2);

	.powered-by {
		opacity: 0.7;
	}

	.shuo-count {
		font-weight: 500;
		color: var(--c-brand);
	}
}

// Essay页面样式的加载容器
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 1rem;
	text-align: center;

	.loading-spinner {
		width: 40px;
		height: 40px;
		margin-bottom: 1rem;
		border: 3px solid var(--c-bg-mute);
		border-top: 3px solid var(--c-brand);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--c-text-2);
	}
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

// Essay页面样式
.page-essay {
	margin-bottom: 1rem;
}

.talk-container {
	width: 100%;
}

.feed-list {
	display: grid;
	gap: 1rem;
	width: 100%;
}

// 新的卡片样式
.post-card {
	width: 100%;
	margin-bottom: 1rem;
	padding: 1rem;
	border: 1px solid var(--c-border);
	border-radius: 1rem;
	background-color: var(--c-bg-soft);
	transition: all 0.3s ease;

	&:hover {
		border-color: var(--c-brand-soft);
		box-shadow: 0 4px 16px rgb(0 0 0 / 15%);
		transform: translateY(-2px);
	}

	// 移动端优化
	@media (max-width: 768px) {
		margin-bottom: 0.75rem;
		padding: 0.75rem;
	}
}

.post-content {
	display: flex;
	flex-direction: column;
}

.post-header {
	display: flex;
	align-items: flex-start;
	margin-bottom: 0.5rem;
}

.avatar {
	width: 48px;
	height: 48px;
	margin-right: 0.75rem;
	border-radius: 50%;
	object-fit: cover;
}

.avatar-link {
	text-decoration: none;
	transition: opacity 0.2s ease;

	&:hover {
		opacity: 0.8;
	}
}

.post-meta {
	display: flex;
	flex: 1;
	flex-direction: column;
}

.author-name {
	margin-bottom: 0.25rem;
	font-size: 16px;
	font-weight: 600;
	text-decoration: none;
	color: var(--c-text-1);

	&:hover {
		text-decoration: underline;
		color: var(--c-brand);
	}
}

.post-time {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 12px;
	color: var(--c-text-2);
}

.likes {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	color: var(--c-text-2);
}

.post-body {
	margin-top: 0.5rem;
}

.post-text {
	overflow-wrap: break-word;
	margin: 0 0 0.5rem;
	font-size: 14px;
	line-height: 1.6;
	white-space: pre-wrap;
	word-break: normal;
	color: var(--c-text-1);
}

// 扩展内容样式
.post-music {
	overflow: hidden;
	margin-top: 0.5rem;
	border-radius: 0.5rem;
}

.post-bilibili {
	overflow: hidden;
	aspect-ratio: 16 / 9;
	margin-top: 0.5rem;
	border-radius: 0.5rem;

	/* 桌面端优化：缩小为原来的3/4 */
	@media (min-width: 768px) {
		max-width: 75%;
		max-height: 33.75vw;
		margin: 0.5rem auto 0;
	}
}

.post-bilibili iframe {
	display: block;
	width: 100%;
	height: 100%;
}

.post-github {
	margin-top: 0.5rem;

	@media (min-width: 768px) {
		overflow: hidden;
		width: 75%;
		margin: 0.5rem auto 0;
		border-radius: 0.5rem;
	}
}

.post-github-og {
	display: block;
	width: 100%;
	height: auto;
	border-radius: 0.5rem;
	transition: transform 0.2s ease;
}

.post-images {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	gap: 0.5rem;
	margin-top: 0.5rem;

	.post-image {
		width: 100%;
		height: 100%;
		border-radius: 0.5rem;
		object-fit: cover;
	}
}

.post-extension {
	margin-top: 0.5rem;
}

.post-link {
	text-decoration: underline;
	color: var(--c-brand);

	&:hover {
		color: var(--c-brand-2);
	}
}

.pagination-container {
	display: flex;
	justify-content: center;
	margin-top: 2rem;
}

.shuo-timeline {
	position: relative;
	padding-left: 2rem;
}

.shuo-timeline::before {
	content: "";
	position: absolute;
	top: 0;
	bottom: 0;
	left: 1rem;
	width: 2px;
	background: var(--c-text-3);
}

.timeline-group {
	position: relative;
	padding-bottom: 0.5rem;
}

.timeline-group::before {
	content: none;
}

.timeline-date {
	position: static;
	margin: 0.5rem 0 0.5rem 1.5rem;
	background: transparent;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--c-text-2);
}

.timeline-date::before {
	content: none;
}

.shuo-item {
	position: relative;
	padding: 1.5rem;
	border: 1px solid var(--c-border);
	border-radius: 1rem;
	box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
	background: var(--c-bg-soft);
	transition: all 0.3s ease;

	// 添加微妙的渐变背景
	&::before {
		content: "";
		position: absolute;
		opacity: 0;
		inset: 0;
		border-radius: 1rem;
		background:
			linear-gradient(
				135deg,
				rgb(255 255 255 / 10%) 0%,
				transparent 100%
			);
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	&:hover {
		border-color: var(--c-brand-soft);
		box-shadow: 0 4px 16px rgb(0 0 0 / 15%);
		transform: translateY(-2px);

		&::before {
			opacity: 1;
		}
	}
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
	overflow-wrap: anywhere;
	line-height: 1.8;
	white-space: pre-wrap;
	word-break: normal;
}

.shuo-music {
	overflow: hidden;
	margin-top: 0.5rem;
	border-radius: 0.5rem;
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

.shuo-extension {
	margin-top: 0.5rem;
}

.shuo-link {
	text-decoration: underline;
	color: var(--c-brand);
}

.shuo-bilibili {
	overflow: hidden;
	aspect-ratio: 16 / 9;
	margin-top: 0.5rem;
	border-radius: 0.5rem;

	/* 桌面端优化：缩小为原来的3/4 */
	@media (min-width: 768px) {
		max-width: 75%; /* 缩小为原来的3/4宽度 */
		max-height: 33.75vw; /* 保持16:9比例下的3/4高度 */
		margin: 0.5rem auto 0; /* 居中显示 */
	}
}

.shuo-bilibili iframe {
	display: block;
	width: 100%;
	height: 100%;
}

.shuo-github {
	margin-top: 0.5rem;

	/* 桌面端容器优化，确保卡片完整显示且为原来的3/4大小 */
	@media (min-width: 768px) {
		overflow: hidden;
		width: 75%; /* 缩小为原来的3/4 */
		margin: 0.5rem auto 0; /* 居中显示 */
		border-radius: 0.5rem;
	}
}

.shuo-github-og {
	display: block;
	width: 100%;
	height: auto;
	border-radius: 0.5rem;
	transition: transform 0.2s ease;
}

// 骨架屏
.skeleton-list {
	display: grid;
	gap: 1rem;
	width: 100%;
	max-width: 600px;
	margin: 0 auto;
}

.skeleton-item {
	padding: 1.5rem;
	border: 1px solid var(--c-border);
	border-radius: 1rem;
	background: var(--c-bg-soft);
}

.skeleton-line {
	height: 0.9rem;
	border-radius: 0.4rem;
	background:
		linear-gradient(
			90deg,
			var(--c-bg-mute) 25%,
			var(--c-bg-soft) 50%,
			var(--c-bg-mute) 75%
		);
	background-size: 200% 100%;
	animation: shimmer 1.5s infinite;

	&.skeleton-time {
		width: 30%;
		height: 0.8rem;
		margin-bottom: 0.6rem;
	}

	&.skeleton-content {
		width: 100%;
		margin: 0.4rem 0;
	}

	&.short {
		width: 70%;
	}
}

@keyframes shimmer {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}
</style>
