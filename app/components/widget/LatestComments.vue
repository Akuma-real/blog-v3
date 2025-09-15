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

const pending = ref(true)
const error = ref<Error | null>(null)
const list = ref<RecentComment[]>([])

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

async function waitForTwikoo(timeout = 6000) {
  const start = Date.now()
  while (!(window as any).twikoo) {
    if (Date.now() - start > timeout) throw new Error('Twikoo 未加载')
    await new Promise(r => setTimeout(r, 100))
  }
}

onMounted(async () => {
  try {
    await waitForTwikoo()
    const tw = (window as any).twikoo
    const res: RecentComment[] = await tw.getRecentComments?.({
      envId: appConfig.twikoo?.envId,
      pageSize: 6,
      includeReply: false,
    })
    list.value = Array.isArray(res) ? res : []
  }
  catch (e: any) {
    error.value = e
  }
  finally {
    pending.value = false
  }
})
</script>

<template>
<ZWidget card title="最新评论">
  <div v-if="pending" class="rc-skeleton">
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
  gap: 0.6rem;
  align-items: start;
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

.rc-main { min-width: 0; }
.rc-head { display: flex; align-items: baseline; gap: .5rem; }
.rc-nick { font-weight: 600; color: var(--c-text); }
.rc-time { font-size: .8em; color: var(--c-text-3); }
.rc-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--c-text-1);
}

.rc-empty { color: var(--c-text-3); }

@keyframes skeleton-pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }
</style>

