<script setup lang="ts">
// 新接口响应数据结构定义（https://api.nsmao.net/api/ip/query）
interface NsmaoIpData {
	ip: string
	country: string
	prov: string
	city: string
	district: string
	adcode: number
	lat: number
	lng: number
	/** 兼容旧 UI 逻辑：若上游未来补充 isp，则可直接显示 */
	isp?: string
}

interface NsmaoIpResponse {
	code: number
	msg: string
	data: NsmaoIpData
	exec_time: number
	ip: string
}

// 从运行时配置读取公开的 key（需在环境变量中提供 NUXT_PUBLIC_IPIP_KEY）
const { public: { ipipKey, bloggerLat, bloggerLng } } = useRuntimeConfig()

const { data: ipInfo, error } = useAsyncData<NsmaoIpResponse | null>(
	'widget-visitor-ip',
	() => {
		if (!ipipKey)
			throw new Error('IP 查询 Key 未配置（NUXT_PUBLIC_IPIP_KEY）')
		return $fetch<NsmaoIpResponse>(`https://api.nsmao.net/api/ip/query?key=${encodeURIComponent(ipipKey as string)}`)
	},
	{
		server: false,
		immediate: true,
		default: () => null,
	},
)

// 国家/省市文本处理
const countryDisplay = computed(() => ipInfo.value?.data?.country || '')
const displayCity = computed(() => {
	const raw = ipInfo.value?.data?.city?.trim() || ''
	const lowered = raw.toLowerCase()
	if (!raw || lowered === 'unknown' || lowered === 'n/a' || raw === '-')
		return ''
	return raw
})
const displayRegion = computed(() => ipInfo.value?.data?.prov || '')

const locationLabel = computed(() => displayCity.value || displayRegion.value || countryDisplay.value || '世界')

const addressText = computed(() => [countryDisplay.value, displayRegion.value, displayCity.value].filter(Boolean).join(' · '))

// 运营商/来访 IP
const ispText = computed(() => ipInfo.value?.data?.isp || '')
const ipText = computed(() => ipInfo.value?.data?.ip?.trim() || '')

// 就绪条件：拿到有效 data
const isReady = computed(() => Boolean(ipInfo.value?.data))

// 计算距博主的直线距离（单位：公里，哈弗辛公式）
const hostLat = Number.isFinite(Number(bloggerLat)) ? Number(bloggerLat) : 32.993421
const hostLng = Number.isFinite(Number(bloggerLng)) ? Number(bloggerLng) : 120.640762
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
	const toRad = (d: number) => (d * Math.PI) / 180
	const R = 6371 // 地球半径（公里）
	const dLat = toRad(lat2 - lat1)
	const dLon = toRad(lon2 - lon1)
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}
const distanceKm = computed(() => {
	const lat = ipInfo.value?.data?.lat
	const lng = ipInfo.value?.data?.lng
	if (typeof lat !== 'number' || typeof lng !== 'number')
		return null
	return haversineKm(lat, lng, hostLat, hostLng)
})
const distanceText = computed(() => {
	const d = distanceKm.value
	if (d == null)
		return ''
	return d >= 100 ? `${Math.round(d)} 公里` : `${Math.round(d * 10) / 10} 公里`
})

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
			<p v-if="distanceText" class="greeting">
				你目前距博主约 <span class="highlight">{{ distanceText }}</span>，带我去你那里逛一逛叭~
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

.detail-expand :deep(.toggle-btn) {
	cursor: pointer;
}
</style>
