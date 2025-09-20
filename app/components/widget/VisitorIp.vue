<script setup lang="ts">
interface IpGeo {
	asn: number
	countryName: string
	countryCodeAlpha2: string
	countryCodeAlpha3: string
	countryCodeNumeric: string
	regionName: string
	regionCode: string
	cityName: string
	latitude: number
	longitude: number
	cisp: string
}

interface IpResponse {
	geo: IpGeo
	uuid: string
	clientIp: string
}

const { data: ipInfo, pending, error } = useAsyncData<IpResponse>(
	'widget-visitor-ip',
	() => $fetch<IpResponse>('https://ip.anye.xyz/json'),
	{
		server: false,
		immediate: true,
		default: () => null,
	},
)

const countryDisplay = computed(() => ipInfo.value?.geo?.countryName || '')
const displayCity = computed(() => {
	const raw = ipInfo.value?.geo?.cityName?.trim() || ''
	const lowered = raw.toLowerCase()
	if (!raw || lowered === 'unknown' || lowered === 'n/a' || raw === '-') return ''
	return raw
})
const displayRegion = computed(() => ipInfo.value?.geo?.regionName || '')

const locationLabel = computed(() => displayCity.value || displayRegion.value || countryDisplay.value || '世界')

const addressText = computed(() => [countryDisplay.value, displayRegion.value, displayCity.value].filter(Boolean).join(' · '))

const ispText = computed(() => ipInfo.value?.geo?.cisp || '')

const ipText = computed(() => ipInfo.value?.clientIp?.trim() || '')

const isReady = computed(() => Boolean(ipInfo.value))

const detailOpen = ref(false)
const hasDetail = computed(() => Boolean(ipText.value || addressText.value || ispText.value))

watch(hasDetail, (value) => {
	if (!value)
		detailOpen.value = false
})
</script>

<template>
<ZWidget title="欢迎卡片" card>
	<div
		class="welcome-card"
		tabindex="0"
		:class="{
			'is-error': error,
			'is-ready': isReady,
		}"
	>
		<template v-if="error">
			<div class="tip">
				暂时无法读取你的来访信息，请稍后再试
			</div>
		</template>
		<template v-else-if="isReady">
			<p class="greeting">
				欢迎你~
				<br>
				来自
				<span class="highlight">{{ locationLabel }}</span>
				的小伙伴，你好呀！
			</p>
			<ZExpand
				v-if="hasDetail"
				v-model="detailOpen"
				in-place
				name="来访详情"
				class="detail-expand"
			>
				<div class="detail-panel">
					<p v-if="ipText" class="detail-row detail-row-ip">
						<span class="label">IP</span>
						<span class="value">{{ ipText }}</span>
					</p>
					<p v-if="addressText" class="detail-row detail-row-address">
						<span class="label">地址</span>
						<span class="value">{{ addressText }}</span>
					</p>
					<p v-if="ispText" class="detail-row detail-row-isp">
						<span class="label">运营商</span>
						<span class="value">{{ ispText }}</span>
					</p>
				</div>
			</ZExpand>
		</template>
		<template v-else>
			<div class="tip">
				正在获取来访信息…
			</div>
		</template>
	</div>
</ZWidget>
</template>

<style lang="scss" scoped>
.welcome-card {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	padding: 0.2rem 0;
	outline: none;

	&.is-ready {
		cursor: pointer;
	}

	&:focus-visible {
		border-radius: 0.6rem;
		box-shadow: 0 0 0 0.12rem var(--c-primary);
	}
}

.detail-panel {
	margin-top: 0.4rem;
	padding: 0.4rem 0.6rem;
	border-radius: 0.6rem;
	box-shadow: 0 0.2rem 0.6rem color-mix(in srgb, var(--c-primary) 15%, transparent);
	background-color: var(--c-bg-soft);
	font-size: 0.85rem;
	line-height: 1.5;
}

.detail-row {
	display: flex;
	align-items: flex-start;
	gap: 0.4rem;
	margin: 0;
	font-family: inherit;
}

.detail-row + .detail-row {
	margin-top: 0.2rem;
}

.detail-row .label {
	display: inline-flex;
	align-items: flex-start;
	position: relative;
	min-width: 3.2rem;
	font-weight: 600;
	color: var(--c-text-2);
}

.detail-row .label::after {
	content: "：";
	margin-inline-start: 0.2rem;
}

.detail-row .value {
	flex: 1;
	overflow-wrap: anywhere;
	font-family: inherit;
}

.detail-row-isp .value {
	opacity: 0.8;
}

.tip {
	font-size: 0.85rem;
	color: var(--c-text-3);
}

.greeting {
	margin: 0;
	font-weight: 600;
	line-height: 1.6;
}

.highlight {
	color: var(--c-primary);
}
</style>
