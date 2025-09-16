<script setup lang="ts">
const appConfig = useAppConfig()

type RecentComment = {
  avatar?: string
  nick?: string
  nickName?: string
  name?: string
  comment?: string
  content?: string
  commentText?: string
  url?: string
  link?: string
  time?: string | number | Date
  created?: string | number | Date
}

type TwikooRecentResponse = {
  data?: RecentComment[]
  accessToken?: string
}

const accessTokenState = useState<string | null>('twikoo-access-token', () => null)

function stripHtml(input?: string) {
  if (!input) return ''
  return input
    .replace(/<[^>]+>/g, ' ') // 去掉 HTML 标签
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function getNick(item: RecentComment) {
  return item.nick || item.nickName || item.name || '匿名'
}

function getLink(item: RecentComment) {
  const to = item.link || item.url || '/'
  return to
}

function getTime(item: RecentComment) {
  const t = item.time || item.created
  if (!t) return ''
  try {
    return getPostDate(new Date(t))
  }
  catch {
    return ''
  }
}

async function fetchRecentComments() {
  const envId = appConfig.twikoo?.envId
  if (!envId) throw new Error('Twikoo 未配置 envId')

  const payload: Record<string, any> = {
    event: 'GET_RECENT_COMMENTS',
    limit: 6,
    includeReply: false,
  }

  if (process.client) {
    const stored = accessTokenState.value || (typeof localStorage !== 'undefined' ? localStorage.getItem('twikoo-access-token') : null)
    if (stored) payload.accessToken = stored
  }

  const response = await $fetch<TwikooRecentResponse>(envId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    timeout: 5000,
  })

  if (process.client && response?.accessToken) {
    accessTokenState.value = response.accessToken
    try {
      localStorage.setItem('twikoo-access-token', response.accessToken)
    }
    catch {}
  }

  return Array.isArray(response?.data) ? response.data : []
}

const { data: comments, pending, error, refresh } = await useAsyncData('latest-comments', fetchRecentComments, {
  default: () => [],
  lazy: false,
  server: true,
})

const list = computed<RecentComment[]>(() => comments.value ?? [])
const loading = computed(() => pending.value && list.value.length === 0)

onMounted(() => {
  refresh().catch(() => {})
})
</script>

<template>
<ZWidget card title="最新评论">
  <div v-if="loading" class="rc-skeleton">
    <div v-for="i in 5" :key="i" class="rc-item skeleton" />
  </div>

  <template v-else>
    <ZError v-if="error">
      <template #title>加载失败</template>
      <template #description>{{ error?.message || '无法获取最新评论' }}</template>
    </ZError>

    <div v-else-if="!list.length" class="rc-empty">暂无评论</div>

    <ul v-else class="rc-list">
      <li v-for="(item, idx) in list" :key="idx" class="rc-item">
        <NuxtImg v-if="item.avatar" class="rc-avatar" :src="item.avatar" alt="" loading="lazy" decoding="async" />
        <div class="rc-main">
          <div class="rc-head">
            <span class="rc-nick">{{ getNick(item) }}</span>
            <time class="rc-time">{{ getTime(item) }}</time>
          </div>
          <ZRawLink :to="getLink(item)" class="rc-text" :title="stripHtml(item.comment || item.content || item.commentText)">
            {{ stripHtml(item.comment || item.content || item.commentText) }}
          </ZRawLink>
        </div>
      </li>
    </ul>
  </template>
</ZWidget>
</template>

<style lang="scss" scoped>
.rc-skeleton {
	display: grid;
	gap: 0.6rem;
}

.rc-list {
	display: grid;
	gap: 0.6rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.rc-item {
	display: grid;
	grid-template-columns: 32px 1fr;
	align-items: start;
	gap: 0.6rem;
}

.skeleton {
	height: 40px;
	border-radius: 0.6rem;
	background: var(--c-bg-mute);
	animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.rc-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	object-fit: cover;
}

.rc-main {
	min-width: 0;
}

.rc-head {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
}

.rc-nick {
	font-weight: 600;
	color: var(--c-text);
}

.rc-time {
	font-size: 0.8em;
	color: var(--c-text-3);
}

.rc-text {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	overflow: hidden;
	-webkit-line-clamp: 2;
	text-overflow: ellipsis;
	color: var(--c-text-1);
}

.rc-empty {
	color: var(--c-text-3);
}

@keyframes skeleton-pulse {
	0%,
	100% {
		opacity: 0.6;
	}

	50% {
		opacity: 0.3;
	}
}
</style>

