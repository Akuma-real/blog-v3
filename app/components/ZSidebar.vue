<script setup lang="ts">
import { API_CONFIG } from '~/config/api'

const appConfig = useAppConfig()
const layoutStore = useLayoutStore()
const searchStore = useSearchStore()

const { word } = storeToRefs(searchStore)

// 从 API 获取站点配置
const { data: siteConfig } = await useAsyncData(
	'sidebar-site-config',
	async () => {
		try {
			const response = await $fetch<any>(
				API_CONFIG.endpoints.siteConfig,
				{ baseURL: API_CONFIG.baseURL },
			)
			if (response?.code === 200 && response?.data) {
				return response.data
			}
			return null
		}
		catch (error) {
			console.error('Failed to fetch site config:', error)
			return null
		}
	},
)

// 侧边栏图标导航：优先使用 API 的 socialBar 配置
const iconNavList = computed(() => {
	// socialBar 在 footer 里面！
	const socialBar = siteConfig.value?.footer?.socialBar
	const iconMapping = appConfig.footer.socialBarIconMapping || {}

	// 图标映射函数：将 API 返回的图标名映射到 Iconify 图标
	const mapIcon = (apiIcon: string): string => {
		// 如果在映射表中找到，使用映射的图标
		if (iconMapping[apiIcon]) {
			return iconMapping[apiIcon]
		}
		// 如果已经是 Iconify 格式（包含冒号），直接使用
		if (apiIcon && apiIcon.includes(':')) {
			return apiIcon
		}
		// 否则使用默认图标
		return 'ph:link-bold'
	}

	// 如果 API 返回了 socialBar 配置
	if (socialBar) {
		// 尝试多种可能的数据结构
		// 1. 如果是数组形式
		if (Array.isArray(socialBar)) {
			return socialBar.map((item: any) => ({
				icon: mapIcon(item.icon || ''),
				text: item.text || item.title || '',
				url: item.url || item.link || '',
			}))
		}

		// 2. 如果是对象形式，可能有 left/right 分组 - 合并两个数组
		if (socialBar.left || socialBar.right) {
			const leftItems = Array.isArray(socialBar.left) ? socialBar.left : []
			const rightItems = Array.isArray(socialBar.right) ? socialBar.right : []
			const allItems = [...leftItems, ...rightItems]

			return allItems.map((item: any) => ({
				icon: mapIcon(item.icon || ''),
				text: item.text || item.title || '',
				url: item.url || item.link || '',
			}))
		}

		// 3. 如果 socialBar 直接包含配置项
		if (socialBar.items && Array.isArray(socialBar.items)) {
			return socialBar.items.map((item: any) => ({
				icon: mapIcon(item.icon || ''),
				text: item.text || item.title || '',
				url: item.url || item.link || '',
			}))
		}
	}

	// API 失败时回退到配置文件
	return appConfig.footer.iconNav
})
</script>

<template>
<Transition>
	<!-- FIXME: 评估是否能公用 bgmask 减少冗余 -->
	<div v-if="layoutStore.isOpen('sidebar')" id="z-sidebar-bgmask" @click="layoutStore.toggle('sidebar')" />
</Transition>
<!-- 此处不能使用 Transition，因为半宽屏状态始终显示 -->
<aside id="z-sidebar" :class="{ show: layoutStore.isOpen('sidebar') }">
	<ZhiluHeader class="sidebar-header" to="/" />

	<nav class="sidebar-nav scrollcheck-y">
		<div class="search-btn sidebar-nav-item gradient-card" @click="layoutStore.toggle('search')">
			<Icon name="ph:magnifying-glass-bold" />
			<span class="nav-text">{{ word || '搜索' }}</span>
			<Key class="keycut" code="K" cmd prevent @press="searchStore.toggle()" />
		</div>

		<template v-for="(group, groupIndex) in appConfig.nav" :key="groupIndex">
			<h3 v-if="group.title">
				{{ group.title }}
			</h3>

			<menu>
				<li v-for="(item, itemIndex) in group.items" :key="itemIndex">
					<ZRawLink :to="item.url" class="sidebar-nav-item" @click="layoutStore.toggle('sidebar')">
						<Icon :name="item.icon" />
						<span class="nav-text">{{ item.text }}</span>
						<Icon v-if="isExtLink(item.url)" class="external-tip" name="ph:arrow-up-right" />
					</ZRawLink>
				</li>
			</menu>
		</template>
	</nav>

	<footer class="sidebar-footer">
		<ThemeToggle />
		<ZIconNavList :list="iconNavList" />
	</footer>
</aside>
</template>

<style lang="scss" scoped>
#z-sidebar {
	display: flex;
	flex-direction: column;
	color: var(--c-text-2);

	&:hover {
		color: currentcolor;
	}

	@media (max-width: $breakpoint-mobile) {
		position: fixed;
		inset-inline-start: 0;
		width: 320px;
		max-width: 100%;
		background-color: var(--ld-bg-blur);
		backdrop-filter: blur(0.5rem);
		color: currentcolor;
		transform: var(--transform-start-far);
		transition: transform 0.2s;
		z-index: 100;

		&.show {
			box-shadow: 0 0 1rem var(--ld-shadow);
			transform: none;
		}
	}
}

#z-sidebar-bgmask {
	position: fixed;
	inset: 0;
	background-color: #0003;
	transition: opacity 0.2s;
	z-index: 100;

	&.v-enter-from,
	&.v-leave-to {
		opacity: 0;
	}

	@media (min-width: $breakpoint-mobile) {
		display: none;
	}
}

.sidebar-nav {
	flex-grow: 1;
	padding: 0 5%;
	font-size: 0.9em;

	h3 {
		margin: 2em 0 1em 1em;
		font: inherit;
		color: var(--c-text-2);
	}

	li {
		margin: 0.5em 0;
	}
}

.sidebar-nav-item {
	display: flex;
	align-items: center;
	gap: 0.5em;
	padding: 0.5em 1em;
	border-radius: 0.5em;
	transition: all 0.2s;

	&:hover,
	&.router-link-active {
		background-color: var(--c-bg-soft);
		color: var(--c-text);
	}

	&.router-link-active::after {
		content: "⦁";
		width: 1em;
		text-align: center;
		color: var(--c-text-3);
	}

	> .iconify {
		font-size: 1.5em;
	}

	> .nav-text {
		flex-grow: 1;
	}

	> .external-tip {
		opacity: 0.5;
		font-size: 1em;
	}
}

.search-btn {
	opacity: 0.5;
	margin: 1rem 0;
	outline: 2px solid var(--c-border);
	outline-offset: -2px;
	cursor: text;

	&:hover {
		opacity: 1;
		outline-color: transparent;
		background-color: transparent;
	}
}

.sidebar-footer {
	--gap: clamp(0.5rem, 3vh, 1rem);

	display: grid;
	gap: var(--gap);
	padding: var(--gap);
	font-size: 0.8em;
	text-align: center;
	color: var(--c-text-2);
}
</style>
