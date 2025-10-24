<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, watch } from 'vue'

// 每个页面加入独立房间（使用路由路径作为房间名），用于房间在线统计与榜单
const route = useRoute()
const holder = shallowRef<ReturnType<typeof useLiveRoom> | null>(null)

function join(room: string) {
	if (typeof window !== 'undefined' && localStorage.getItem('presenceDebug')) {
		console.info('[Room Presence] join', room)
	}
	const conn = useLiveRoom({ room })
	holder.value = conn
	try { conn.connect() } catch {}
}

onMounted(() => {
	join(route.path || '/')
})

watch(() => route.path, (p, prev) => {
	if (p === prev)
		return
	// 释放旧的房间连接引用
	try { holder.value?.disconnect() }
	catch {}
	join(p || '/')
})

onUnmounted(() => {
	try { holder.value?.disconnect() }
	catch {} holder.value = null
})
</script>

<template>
<!-- 无 UI，仅用于确保当前页面加入独立房间以参与 Presence 统计 -->
<span style="display: none;" />
</template>
