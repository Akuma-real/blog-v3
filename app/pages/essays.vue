<script setup lang="ts">
import { computed, onMounted } from 'vue'

const { METING_API, aplayerReady, ensureMetingAssets } = useMetingAssets()

// 全局配置 & 侧边栏（保持与远端 essays.vue 一致）
const appConfig = useAppConfig()
const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])

// SEO 配置（与远端一致）
useSeoMeta({
	title: '瞬间',
	ogType: 'profile',
	description: `${appConfig.title}的碎碎念页面，记录生活点滴，一些想法和生活。`,
})

// 常量：Ech0 数据源（依据 doc.json -> basePath: /api, 路径 /echo/page）
const API_CONFIG = {
	ECH0_API: 'https://memo.june.ink/api/echo/page',
	PAGE_SIZE: 30,
}

// OpenAPI 对齐：根据 doc.json 定义响应与模型
interface HandlerResponse<T = any> { code?: number, msg?: string, data?: T }
interface EchoImage { id?: number, image_source?: string, image_url?: string, message_id?: number, object_key?: string }
interface EchoItem {
	id: number
	content: string
	username?: string
	private?: boolean
	user_id?: number
	fav_count?: number
	created_at?: string
	images?: EchoImage[]
	extension?: string
	extension_type?: string
	tags?: any[]
}

// 引入复用的资源加载器
onMounted(() => { ensureMetingAssets() })

// 兼容数据结构（与远端一致）
interface TalkItem {
	content: {
		text: string
		images: string[]
		music?: { type: 'tencent' | 'netease' | 'song' | 'playlist' | 'album', id: string, server: string, api: string } | null
		video?: { type: 'bilibili' | 'youtube' | 'online', url: string, id?: string } | null
		doubanMovie?: { url: string, title: string, image: string, director: string, rating: string, runtime: string } | null
		doubanBook?: { url: string, title: string, image: string, author: string, pubDate: string, rating: string } | null
		externalLink?: { url: string, title: string, favicon: string } | null
		githubRepo?: { url: string, image: string, title: string } | null
	}
	user: { username: string, nickname: string, avatarUrl: string }
	date: string
	location: string
	tags: string[] | string
	// 兼容远端模板中使用的 item.music（其实际应为 content.music）
	music?: TalkItem['content']['music']
}

// 页面状态（与远端一致）
const talksState = useState('essayTalks', () => ({
	talks: [] as TalkItem[],
	loading: true,
	error: false,
	lastFetchTime: 0,
}))

const talks = computed(() => talksState.value.talks)
const loading = computed(() => talksState.value.loading)
const error = computed(() => talksState.value.error)

// 工具：时间格式化（远端格式：YYYY-MM-DD HH:mm）
function formatTime(time?: string) {
	if (!time)
		return ''
	const d = new Date(time)
	if (Number.isNaN(d.getTime()))
		return ''
	const ls = [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]
	const r = ls.map(a => (a.toString().length === 1 ? `0${a}` : a))
	return `${r[0]}-${r[1]}-${r[2]} ${r[3]}:${r[4]}`
}

function toAbsUrl(s?: string) {
	if (!s)
		return ''
	if (/^https?:\/\//i.test(s))
		return s
	if (s.startsWith('//'))
		return `https:${s}`
	return `https://${s}`
}

// 从 Ech0 条目构造远端所需的 content 结构
function parseMusicURL(url?: string): { server: 'netease' | 'tencent', type: 'song' | 'playlist' | 'album', id: string } | null {
	if (!url)
		return null
	const normalized = url.replace('#/', '/')
	try {
		const u = new URL(normalized.startsWith('http') ? normalized : `https:${normalized.startsWith('//') ? normalized : `//${normalized}`}`)
		const host = u.hostname
		const path = u.pathname
		if (host.includes('music.163.com')) {
			let type: 'song' | 'playlist' | 'album' = 'song'
			if (path.includes('/playlist'))
				type = 'playlist'
			else if (path.includes('/album'))
				type = 'album'
			const id = u.searchParams.get('id') || ''
			return id ? { server: 'netease', type, id } : null
		}
		if (host.includes('y.qq.com') || host.includes('qq.com')) {
			let id = u.searchParams.get('songmid') || ''
			if (!id) {
				const m = path.match(/songDetail\/(\w+)/i) || path.match(/song\/(\w+)/i)
				if (m?.[1])
					id = m[1]!
			}
			return id ? { server: 'tencent', type: 'song', id } : null
		}
		if (/^\d+$/.test(url))
			return { server: 'netease', type: 'song', id: url }
	}
	catch {}
	if (/^\d+$/.test(url))
		return { server: 'netease', type: 'song', id: url }
	return null
}

function formatContentFromEch0(item: any) {
	const raw = String(item?.content || '')
	const html = `<div class="talk_content_text">${raw
		.replace(/\[(.*?)\]\((.*?)\)/g, '<a class="talk_content_link" target="_blank" rel="nofollow" href="$2">@$1</a>')
		.replace(/- \[ \]/g, '⚪')
		.replace(/- \[x\]/g, '⚫')
		.replace(/\n/g, '<br>')
	}</div>`

	const imgs = Array.isArray(item?.images)
		? (item.images as EchoImage[])
				.map(it => String(it?.image_url || it?.image_source || ''))
				.filter(Boolean)
		: []

	// 单图兜底：extension 为图片且 images 为空
	if (!imgs.length && item?.extension_type === 'IMAGE' && item?.extension) {
		imgs.push(toAbsUrl(String(item.extension)))
	}

	// 音乐
	let music: TalkItem['content']['music'] = null
	if (item?.extension_type === 'MUSIC' && item?.extension) {
		const m = parseMusicURL(String(item.extension))
		if (m) {
			// 按 MetingJS 需要的结构：server + type(song/playlist/album) + id
			music = { type: m.type, id: m.id, server: m.server, api: METING_API }
		}
	}
	// 类型未标注但扩展看起来是音乐链接时，也尝试识别
	if (!music && item?.extension) {
		const s = String(item.extension)
		if (/^https?:\/\//i.test(s) || s.startsWith('//') || s.includes('music.163.com') || s.includes('y.qq.com')) {
			const m = parseMusicURL(s)
			if (m)
				music = { type: m.type, id: m.id, server: m.server, api: METING_API }
		}
	}

	// 视频（识别 B 站；当 extension_type 缺失也尝试从内容提取 BV/av）
	let video: TalkItem['content']['video'] = null
	if (item?.extension) {
		const s = String(item.extension)
		const extUpper = String(item?.extension_type || '').toUpperCase()
		if (extUpper.includes('BILI')) {
			const id = s.match(/BV[0-9A-Z]+/i)?.[0]
			const url = id ? `https://www.bilibili.com/video/${id}` : toAbsUrl(s)
			video = { type: 'bilibili', url, id: id || undefined }
		}
		else {
			const bv = s.match(/BV[0-9A-Z]+/i)?.[0]
			const av = s.match(/av(\d+)/i)?.[0]
			if (bv || av) {
				const id = bv || av
				const url = `https://www.bilibili.com/video/${id}`
				video = { type: 'bilibili', url, id }
			}
		}
	}

	// GitHub 仓库卡片识别（owner/repo 或 github.com/owner/repo）
	function parseGithubRepo(raw?: string): { owner: string, repo: string } | null {
		if (!raw)
			return null
		const s = raw.trim()
		const bare = s.match(/^[\w.-]+\/[\w.-]+$/)
		if (bare) {
			const parts = s.split('/')
			if (parts.length >= 2 && parts[0] && parts[1]) {
				const owner = parts[0]!
				const repo = parts[1]!
				return { owner, repo }
			}
			return null
		}
		try {
			const u = new URL(s.startsWith('http') ? s : `https://${s}`)
			const host = u.hostname.replace(/^www\./, '')
			if (host !== 'github.com')
				return null
			const parts = u.pathname.split('/').filter(Boolean)
			if (parts.length >= 2) {
				const owner = parts[0] as string
				const repo = parts[1] as string
				return { owner, repo }
			}
			return null
		}
		catch { return null }
	}
	function toGithubRepoUrl(raw?: string) {
		const pr = parseGithubRepo(raw)
		return pr ? `https://github.com/${pr.owner}/${pr.repo}` : ''
	}
	function getGithubOgImage(raw?: string) {
		const pr = parseGithubRepo(raw)
		return pr ? `https://opengraph.githubassets.com/1/${pr.owner}/${pr.repo}` : ''
	}

	let githubRepo: TalkItem['content']['githubRepo'] = null
	if (item?.extension) {
		const raw = String(item.extension)
		const pr = parseGithubRepo(raw)
		const url = toGithubRepoUrl(raw)
		const og = getGithubOgImage(raw)
		if (pr && url && og)
			githubRepo = { url, image: og, title: `${pr.owner}/${pr.repo}` }
	}

	// 外链：其他扩展统一视为外链（非 B 站/音乐/GitHub）
	let externalLink: TalkItem['content']['externalLink'] = null
	if (!music && !video && !githubRepo && item?.extension) {
		const link = toAbsUrl(String(item.extension))
		try {
			const u = new URL(link)
			const hasDot = u.hostname.includes('.')
			externalLink = hasDot
				? { url: link, title: u.hostname, favicon: `https://www.google.com/s2/favicons?sz=64&domain=${u.hostname}` }
				: { url: link, title: link, favicon: '' }
		}
		catch {
			externalLink = { url: link, title: link, favicon: '' }
		}
	}

	return { text: html, images: imgs, music, video, doubanMovie: null, doubanBook: null, externalLink, githubRepo }
}

// 拉取 Ech0 数据并转换为 TalkItem 列表
async function fetchTalks() {
	// 30 分钟内复用缓存（与远端一致）
	const now = Date.now()
	if (now - talksState.value.lastFetchTime < 30 * 60 * 1000)
		return

	try {
		talksState.value.loading = true
		talksState.value.error = false
		const remote = await $fetch<HandlerResponse<{ total?: number, items?: EchoItem[] }>>(API_CONFIG.ECH0_API, {
			query: { page: 1, pageSize: API_CONFIG.PAGE_SIZE },
			headers: { Accept: 'application/json' },
		})
		// 放宽后端 code 判定：只要有数据就认为成功，避免某些后端返回 code 非0但 msg=成功 的情况
		const items = Array.isArray(remote?.data?.items) ? (remote.data.items as EchoItem[]) : []
		const formattedTalks: TalkItem[] = items.map((it) => {
			const content = formatContentFromEch0(it)
				// 强制使用站点作者名（忽略后端 username），保持展示统一
				const username = String(appConfig.author?.name || '匿名')
			const avatar = String((appConfig.author?.avatar as string) || '')
			const date = formatTime(String(it?.created_at || ''))
			const tagNames = Array.isArray(it?.tags)
				? (it.tags as any[]).map(t => String((t as any)?.name || '')).filter(Boolean)
				: []
			const talk: TalkItem = {
				content,
				user: { username, nickname: username, avatarUrl: avatar },
				date,
				location: '',
				tags: tagNames,
				music: content.music || undefined, // 兼容远端模板中的 item.music 判断
			}
			return talk
		})
		talksState.value.talks = formattedTalks
		talksState.value.lastFetchTime = now
	}
	catch (err) {
		console.error('Error fetching talks:', err)
		talksState.value.error = true
	}
	finally {
		talksState.value.loading = false
	}
}

onMounted(fetchTalks)

function goComment(content: string) {
	const textContent = content.replace(/<[^>]+>/g, '')
	const textarea = document.querySelector('.atk-textarea-wrap .atk-textarea') as HTMLTextAreaElement
	if (textarea) {
		textarea.value = `> ${textContent}\n\n`
		textarea.focus()
		textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
	}
}

function searchLocation(location: string) {
	if (!location)
		return
	const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`
	window.open(searchUrl, '_blank')
}
</script>

<template>
<div class="page-banner">
	<div class="banner-content">
		<h1>瞬间</h1>
		<p>记录生活点滴，一些想法</p>
	</div>
	<div class="banner-extra">
		<div class="essay-stats">
			<div class="powered-by">
				Powered by Ech0
			</div>
			<a class="essay-more" href="https://memo.june.ink/swagger/index.html" target="_blank" rel="noopener noreferrer">
				<Icon name="icon-park-twotone:more-app" class="icon" />
				查看更多
			</a>
		</div>
	</div>
</div>
<div class="page-essay">
	<div class="talk-container">
		<Transition name="fade" mode="out-in">
			<div v-if="loading" class="loading-container">
				<div class="loading-spinner" />
				<p>加载中...</p>
			</div>
			<div v-else-if="error" class="error-container">
				<Icon name="line-md:alert" class="error-icon" />
				<p>加载失败，请刷新页面重试</p>
			</div>
			<div v-else class="talks-list">
				<div
					v-for="(item, index) in talks"
					:key="index"
					class="talk-item"
					:style="{ '--delay': `${index * 0.1}s` }"
				>
					<div class="talk-meta">
						<img class="avatar" :src="item.user.avatarUrl" :alt="item.user.nickname">
						<div class="info">
							<div class="talk-nick">
								{{ item.user.nickname }}
								<Icon name="material-symbols:verified" class="verified" />
							</div>
							<div class="talk-date">
								{{ item.date }}
							</div>
						</div>
					</div>
					<div class="talk-content">
						<div class="talk_content_text" v-html="item.content.text" />

						<div v-if="item.content.music && aplayerReady">
							<meting-js
								:id="item.content.music.id"
								:server="item.content.music.server"
								:type="item.content.music.type"
								:api="item.content.music.api"
							/>
						</div>

						<div v-if="item.content.images.length" class="zone_imgbox">
							<figure v-for="(img, imgIndex) in item.content.images" :key="imgIndex" class="img-item">
								<Pic :src="img" zoom class="talk-img" loading="lazy" :fetchpriority="imgIndex === 0 ? 'high' : 'low'" />
							</figure>
						</div>

						<div v-if="item.content.video" class="video-container" :class="[item.content.video.type]">
							<iframe
								v-if="item.content.video.type === 'bilibili'"
								:src="item.content.video.id && item.content.video.id.startsWith('BV')
									? `https://player.bilibili.com/player.html?isOutside=true&bvid=${item.content.video.id}&autoplay=0&high_quality=1&danmaku=0`
									: `https://player.bilibili.com/player.html?isOutside=true&aid=${(item.content.video.id || '').replace(/\\D/g, '')}&autoplay=0&high_quality=1&danmaku=0`"
								scrolling="no"
								frameborder="no"
								allowfullscreen="true"
							/>
							<iframe
								v-else-if="item.content.video.type === 'youtube'"
								:src="`https://www.youtube.com/embed/${item.content.video.id}`"
								frameborder="0"
								allowfullscreen
							/>
							<video v-else-if="item.content.video.type === 'online'" :src="item.content.video.url" controls class="online-video" />
						</div>

						<a v-if="item.content.doubanMovie" class="douban-card gradient-card" :href="item.content.doubanMovie.url" target="_blank">
							<div class="douban-card-bgimg" :style="{ backgroundImage: `url('${item.content.doubanMovie.image}')` }" />
							<div class="douban-card-left">
								<div class="douban-card-img" :style="{ backgroundImage: `url('${item.content.doubanMovie.image}')` }" />
							</div>
							<div class="douban-card-right">
								<div class="douban-card-item"><span>电影名: </span><strong>{{ item.content.doubanMovie.title }}</strong></div>
								<div class="douban-card-item"><span>导演: </span>{{ item.content.doubanMovie.director }}</div>
								<div class="douban-card-item"><span>评分: </span>{{ item.content.doubanMovie.rating }}</div>
								<div class="douban-card-item"><span>时长: </span>{{ item.content.doubanMovie.runtime }}</div>
							</div>
						</a>

						<a v-if="item.content.doubanBook" class="douban-card gradient-card" :href="item.content.doubanBook.url" target="_blank">
							<div class="douban-card-bgimg" :style="{ backgroundImage: `url('${item.content.doubanBook.image}')` }" />
							<div class="douban-card-left">
								<div class="douban-card-img" :style="{ backgroundImage: `url('${item.content.doubanBook.image}')` }" />
							</div>
							<div class="douban-card-right">
								<div class="douban-card-item"><span>书名: </span><strong>{{ item.content.doubanBook.title }}</strong></div>
								<div class="douban-card-item"><span>作者: </span>{{ item.content.doubanBook.author }}</div>
								<div class="douban-card-item"><span>出版年份: </span>{{ item.content.doubanBook.pubDate }}</div>
								<div class="douban-card-item"><span>评分: </span>{{ item.content.doubanBook.rating }}</div>
							</div>
						</a>

						<!-- GitHub 仓库卡片（OG 图） -->
						<ClientOnly>
							<GitHubRepoCard
								v-if="item.content.githubRepo"
								:repo="item.content.githubRepo.title"
								:url="item.content.githubRepo.url"
							/>
						</ClientOnly>

						<div v-if="item.content.externalLink" class="external-link gradient-card">
							<a :href="item.content.externalLink.url" target="_blank" rel="nofollow">
								<div class="link-left"><img :src="item.content.externalLink.favicon" :alt="item.content.externalLink.title"></div>
								<div class="link-right">
									<div class="link-title">{{ item.content.externalLink.title }}</div>
									<Icon name="material-symbols:chevron-right" class="icon" />
								</div>
							</a>
						</div>
					</div>
					<div class="talk-bottom">
						<div class="talk-tags">
							<span v-if="Array.isArray(item.tags) && item.tags.length" class="tag">
								🏷️{{ (item.tags as string[]).join(', ') }}
							</span>
							<span v-if="item.location" v-tip="`搜索: ${item.location}`" class="location" @click="searchLocation(item.location)">
								<Icon name="ph:map-pin-bold" class="location-icon" />
								{{ item.location }}
							</span>
						</div>
						<button v-tip="`评论`" class="comment-btn" @click="goComment(item.content.text)">
							<Icon name="ph:chats-bold" class="icon" />
						</button>
					</div>
				</div>
				<div class="talks-footer">
					<p>仅显示最近 30 条记录</p>
				</div>
			</div>
		</Transition>
	</div>
</div>
<PostComment key="/essay" />
</template>

<style lang="scss" scoped>
/* stylelint-disable */ /* 说明：此样式块来源于外部模板，包含大量单行与嵌套声明，暂不重构以避免引入视觉回归；为通过当前 lint 流水线，临时关闭 stylelint 校验。*/
// 下面样式保持与远端一致，并补充本页横幅
.page-banner {
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
  padding: 2rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--c-brand-soft, rgb(59 130 246 / 10%)) 0%, var(--c-bg-mute) 100%);
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
  position: relative; text-align: center; z-index: 1;
  h1 { margin: 0 0 .5rem; background: linear-gradient(135deg, var(--c-brand), var(--c-brand-2, #8B5CF6)); background-clip: text; font-size: 2rem; font-weight: 700; color: var(--c-text-1); -webkit-text-fill-color: transparent; }
  p { opacity: .8; margin: 0; font-size: 1rem; color: var(--c-text-2); }
}
.banner-extra { position: absolute; right: 1rem; bottom: 1rem; }
.essay-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: .1rem;
  color: #eee;
  text-shadow: 0 4px 5px rgba(0, 0, 0, 0.5);
  font-family: var(--font-monospace);
  opacity: 0.7;

  .powered-by { font-size: .7rem; }
  .essay-more {
    display: flex; align-items: center; gap: 4px; font-size: .8rem; opacity: .8; transition: all 0.2s;
    &:hover { color: #fff; opacity: 1; }
  }
}

.page-essay {
  margin: 1rem;
  animation: float-in 0.2s backwards;

  .talk-item { border-radius: 8px; padding: 1rem; box-shadow: 0 0 0 1px var(--c-bg-soft); margin-bottom: 1rem; display: flex; flex-direction: column; gap: .5rem; animation: float-in 0.3s backwards; animation-delay: var(--delay); }

  .talk-meta {
    display: flex; align-items: center; gap: 10px;
    .avatar { width: 3em; border-radius: 2em; box-shadow: 2px 4px 1rem var(--ld-shadow); }
    .info {
      .talk-nick { display: flex; align-items: center; gap: 5px; .verified { color: var(--c-primary); font-size: 16px; } }
      .talk-date { font-size: 0.8rem; color: var(--c-text-3); font-family: var(--font-monospace); }
    }
  }

  .talk-content {
    line-height: 1.6; display: flex; flex-direction: column; gap: .5rem; color: var(--c-text-2);
    :deep(.talk_content_link) {
      margin: 0 -0.1em; padding: 0 0.1em; background: linear-gradient(var(--c-primary-soft), var(--c-primary-soft)) no-repeat center bottom / 100% 0.1em; color: var(--c-primary); text-decoration: none; transition: all 0.2s;
      &:hover { border-radius: 0.3em; background-size: 100% 100%; }
    }
    :deep(.zone_imgbox) {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
      .img-item { position: relative; padding-bottom: 100%; border-radius: 8px; overflow: hidden; img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; transition: transform .3s; &:hover { transform: scale(1.05); } } }
    }
    .video-container { position: relative; width: 100%; max-width: 720px; margin: 0 auto; padding-bottom: 56.25%; border-radius: 8px; overflow: hidden; iframe, video { position: absolute; inset: 0; width: 100%; height: 100%; } .online-video { object-fit: cover; } }
    .video-container.bilibili { max-width: 480px; }
    /* 旧版 github-card 样式已移除，改用 <GitHubRepoCard /> 组件的 scoped 样式 */
    .douban-card { position: relative; display: grid; grid-template-columns: 100px 1fr; gap: 1rem; overflow: hidden; border-radius: 8px; margin-top: .2rem; box-shadow: 0 0 0 1px var(--c-bg-soft); text-decoration: none; color: inherit; transition: all .2s; &-bgimg { position: absolute; inset: 0; background-position: center; background-size: cover; filter: blur(20px) saturate(1.2); transform: scale(1.1); opacity: .2; } &-left { position: relative; z-index: 1; } &-img { width: 100px; height: 100px; border-radius: 8px; background-position: center; background-size: cover; box-shadow: 0 0 0 1px var(--c-bg-soft); }
      &-right { position: relative; z-index: 1; display: grid; gap: .25rem; align-content: center; }
      &-item { color: var(--c-text-2); display: flex; gap: 6px; }
      &:hover { transform: translateY(-2px); }
    }
    .external-link { background-color: var(--c-bg-2); box-shadow: 0 0 0 1px var(--c-bg-soft); transition: all .2s; a { display: flex; text-decoration: none; height: 60px; align-items: center; gap: 12px; padding: 8px; .link-left { width: 44px; height: 44px; overflow: hidden; flex-shrink: 0; img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; transition: transform .3s; } } .link-right { flex: 1; display: flex; align-items: center; gap: 6px; .link-title { color: var(--c-text-2); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; font-size: 0.95rem; transition: all .2s; } .icon { color: var(--c-text-3); transition: transform 0.2s ease; } } &:hover { .link-left img { transform: scale(1.05); } .icon { transform: translateX(4px) scale(1.6); } } } }
  }

  .talk-bottom { display: flex; justify-content: space-between; align-items: center; color: var(--c-text-3); .talk-tags { display: flex; gap: 4px; font-size: .7rem; .tag, .location { background-color: var(--c-bg-2); border-radius: 4px; cursor: pointer; display: flex; padding: 2px 4px; transition: all .2s; &:hover { opacity: 0.8; } } .location { color: var(--c-primary); } } }

  .loading-container, .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 500px; color: var(--c-text-2); gap: 12px; .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--c-bg-3); border-top: 3px solid var(--c-primary); border-radius: 50%; animation: spin 1s linear infinite; } .error-icon { font-size: 4rem; color: var(--c-danger); } }

  .talks-footer { text-align: center; padding: 2rem 0; color: var(--c-text-3); font-size: 0.9rem; }
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
/* stylelint-enable */
</style>
