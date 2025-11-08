<script setup lang="ts">
import { ZDate } from '#components'
import NumberTransition from '~/components/partial/NumberTransition.vue'

const appConfig = useAppConfig()
const runtimeConfig = useRuntimeConfig()

const { data: stats } = useFetch('/api/stats')
// 实时在线人数（全站），使用新通道
const { count: liveCount, connecting } = useGatewayOnline()

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
	value: () => h(ZDate, {
		date: runtimeConfig.public.buildTime,
		relative: true,
		tipPrefix: '构建于',
	}),
	tip: computed(() => `构建于${getLocaleDatetime(runtimeConfig.public.buildTime)}`),
}
const statWords = {
	label: '总字数',
	value: computed(() => stats.value ? formatNumber(stats.value.total.words) : ''),
	tip: yearlyTip,
}
const statOnline = {
	label: '在线人数',
	value: computed(() => h(
		'span',
		{ class: 'online-trigger', 'aria-busy': connecting.value },
		connecting.value ? '连接中…' : h(NumberTransition, { value: Number(liveCount.value) }),
	)),
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

.online-trigger {
	display: inline-flex;
	align-items: center;
	gap: 0.25em;
	padding: 0.1em 0.6em;
	border-radius: 999px;
	background: color-mix(in srgb, var(--c-primary) 10%, transparent);
	color: var(--c-primary);
}
</style>
