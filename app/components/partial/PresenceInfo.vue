<script setup lang="ts">
import NumberTransition from '~/components/partial/NumberTransition.vue'

// 全局在线频道：/web（VISITOR_ONLINE）
const { count, connecting, connected } = useGatewayOnline()

// 房间榜单（可选，接口缺省时显示占位）
// 房间榜单：改为直接读取 /v1/activity/rooms，保证实时反映任意房间（不依赖额外聚合）
const { public: pub } = useRuntimeConfig()
const roomsEndpoint = computed(() => {
	const origin = pub.gatewayOrigin || location.origin
	return `${origin.replace(/\/$/, '')}/v1/activity/rooms`
})
const { data: roomsRaw, status, refresh } = useFetch<{ rooms: string[], room_count: Record<string, number> }>(roomsEndpoint, {
	server: false,
	lazy: true,
	default: () => ({ rooms: [], room_count: {} }),
})
const rooms = computed(() => {
	const raw = roomsRaw.value
	if (!raw)
		return []
	const entries = Object.entries(raw.room_count || {})
		.map(([room, count]) => ({ room, path: room, title: room, count: Number(count) || 0 }))
		.filter(r => r.room && r.room.toLowerCase() !== 'global')
		.sort((a, b) => b.count - a.count)
	return entries.slice(0, 10)
})
</script>

<template>
<div class="presence">
	<!-- 房间榜单弹层：点击人数文本触发，hover 也可打开（移动端点击） -->
	<Tooltip placement="top" interactive :delay="[100, 150]" hide-on-click="toggle">
		<button class="summary" type="button" :aria-busy="connecting">
			正在被 <NumberTransition :value="Number(count)" /> 人看爆
		</button>
		<template #content>
			<ClientOnly>
				<template #fallback>
					<div class="loading">
						加载中…
					</div>
				</template>
				<div class="rooms">
					<template v-if="status === 'pending'">
						<div class="loading">
							加载中…
						</div>
					</template>
					<template v-else-if="rooms && rooms.length">
						<div class="title">
							下面的内容正在被看爆：
						</div>
						<ul>
							<li v-for="r in rooms" :key="(r.path || r.room)">
								<NuxtLink
									class="link"
									:to="(() => { const raw = r.path || r.room || ''; return raw.startsWith('/') ? raw : (`/${raw}`) })()"
								>
									{{ r.title || r.room }}
								</NuxtLink>
								<span v-if="r.count" class="count"><Icon name="ph:user-bold" /> {{ r.count }}</span>
							</li>
						</ul>
					</template>
					<template v-else>
						<div class="empty">
							还没有小伙伴在阅览文章哦~
						</div>
					</template>
					<div class="ops">
						<button type="button" @click="refresh">
							刷新
						</button>
					</div>
				</div>
			</ClientOnly>
		</template>
	</Tooltip>

	<!-- 实现说明弹层：与 source GatewayInfo.Help 对齐 -->
	<Tooltip placement="top" :delay="200">
		<button class="help" aria-label="在线人数说明" title="在线人数说明" type="button">
			<Icon name="ph:question-bold" />
		</button>
		<template #content>
			<div class="tip">
				<p class="tip-title">
					<Icon name="ph:question-bold" /> 这是如何实现的？
				</p>
				<p>当你打开这个页面时，会自动建立 WebSocket 连接；连接成功后，服务器会推送当前浏览页面或全站房间的人数。</p>
				<hr>
				<p>当前 Socket 状态：<b>{{ connected ? '已连接' : (connecting ? '连接中…' : '未连接') }}</b></p>
			</div>
		</template>
	</Tooltip>
</div>
</template>

<style scoped lang="scss">
.presence {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

.summary {
	display: inline-flex;
	align-items: center;
	gap: 0.25em;
	padding: 0.2em 0.6em;
	border-radius: 999px;
	background: color-mix(in srgb, var(--c-primary) 10%, transparent);
	font-size: 0.85em;
	color: var(--c-primary);
}

.help {
	display: inline-grid;
	place-items: center;
	width: 1.4em;
	height: 1.4em;
	border-radius: 999px;
	background: color-mix(in srgb, var(--c-primary) 8%, transparent);
	color: var(--c-primary);
}

.rooms {
	width: min(80vw, 420px);
}

.rooms .title {
	margin-bottom: 0.5rem;
	font-size: 0.95em;
	font-weight: 600;
}

.rooms ul {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}

.rooms li {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.rooms .link {
	text-decoration: none;
	color: var(--c-text-1);
}

.rooms .link:hover {
	text-decoration: underline;
}

.rooms .count {
	display: inline-flex;
	align-items: center;
	gap: 0.25em;
	font-size: 0.9em;
	color: var(--c-text-3);
}

.rooms .loading,
.rooms .empty {
	color: var(--c-text-3);
}

.rooms .ops {
	display: flex;
	justify-content: flex-end;
	margin-top: 0.5rem;
}

.tip {
	max-width: 36ch;
	line-height: 1.6;
}

.tip-title {
	display: inline-flex;
	align-items: center;
	gap: 0.4em;
	margin-bottom: 0.4em;
	font-weight: 600;
}

hr {
	height: 1px;
	margin: 0.5em 0;
	border: none;
	background: color-mix(in srgb, var(--c-primary) 15%, transparent);
}
</style>
