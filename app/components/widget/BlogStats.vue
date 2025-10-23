<script setup lang="ts">
import { NuxtTime } from '#components'

const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()

const { data: stats } = useFetch('/api/stats')
// 实时在线人数（全站房间）
const { count: liveCount, connecting } = useLiveRoom({ room: 'global' })

const yearlyTip = computed(() => {
	if (!stats.value)
		return ''
	return Object.entries(stats.value.annual).reverse().map(([year, item]) =>
		`${year}年：${item.posts}篇，${formatNumber(item.words)}字`,
	).join('\n')
})

const statRuntime = {
	label: '运营时长',
	value: timeElapse(appConfig.timeEstablished),
	tip: `博客于${appConfig.timeEstablished}上线`,
}
const statUpdated = {
	label: '上次更新',
	value: () => h(NuxtTime, { datetime: runtimeConfig.public.buildTime, relative: true }),
	tip: computed(() => `构建于${getLocaleDatetime(runtimeConfig.public.buildTime)}`),
}
const statWords = {
	label: '总字数',
	value: computed(() => stats.value ? formatNumber(stats.value.total.words) : ''),
	tip: yearlyTip,
}
const statOnline = {
	label: '在线人数',
	value: computed(() => connecting.value ? '连接中…' : (Number.isFinite(liveCount.value as number) ? String(liveCount.value) : '—')),
	tip: '当前全站在线人数',
}

const blogStatsRow1 = [statRuntime, statUpdated]
const blogStatsRow2 = [statWords, statOnline]
</script>

<template>
<ZWidget card title="博客统计">
	<div class="stats-stack">
		<ZDlGroup :items="blogStatsRow1" size="small" />
		<ZDlGroup :items="blogStatsRow2" size="small" />
	</div>
</ZWidget>
</template>

<style scoped>
.stats-stack > :not(:first-child) {
	margin-top: 0.25rem;
}
</style>
