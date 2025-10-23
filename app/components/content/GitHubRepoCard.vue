<script setup lang="ts">
interface Props {
	repo: string // owner/repo
	url: string
}
const props = defineProps<Props>()

const root = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const name = ref('')
const desc = ref('')
const stars = ref<number>(0)

// 简易缓存，降低匿名 API 限流影响
const cacheKey = computed(() => `gh:repo:${props.repo}`)

async function fetchRepo() {
	try {
		const cached = sessionStorage.getItem(cacheKey.value)
		if (cached) {
			const j = JSON.parse(cached)
			name.value = j.name
			desc.value = j.desc
			stars.value = j.stars
			loading.value = false
			return
		}
	}
	catch {}

	try {
		const res = await fetch(`https://api.github.com/repos/${props.repo}`, {
			headers: { Accept: 'application/vnd.github+json' },
		})
		if (!res.ok)
			throw new Error(`GitHub API ${res.status}`)
		const data = await res.json()
		name.value = data?.full_name || data?.name || props.repo
		desc.value = data?.description || ''
		stars.value = Number(data?.stargazers_count || 0)
		try {
			sessionStorage.setItem(
				cacheKey.value,
				JSON.stringify({ name: name.value, desc: desc.value, stars: stars.value }),
			)
		}
		catch {}
	}
	catch (e: any) {
		// 静默降级为 OG 图卡片
		error.value = e?.message || 'fetch fail'
	}
	finally {
		loading.value = false
	}
}

onMounted(() => {
	if (!root.value)
		return
	const io = new IntersectionObserver((entries) => {
		if (entries.some(e => e.isIntersecting)) {
			fetchRepo()
			io.disconnect()
		}
	}, { rootMargin: '200px' })
	io.observe(root.value)
})
</script>

<template>
<div ref="root" class="gh-card gradient-card">
	<a :href="url" target="_blank" rel="noopener noreferrer" class="gh-link">
		<div class="gh-info">
			<Icon name="bi:github" class="gh-icon" />
			<div class="gh-title">{{ name || repo }}</div>
			<div v-if="!loading" class="gh-stars" aria-label="stars">
				<Icon name="ph:star-bold" />
				<span>{{ stars }}</span>
			</div>
		</div>
	</a>
	<div v-if="!loading && desc" class="gh-desc">
		{{ desc }}
	</div>
</div>
</template>

<style scoped lang="scss">
/* stylelint-disable */
.gh-card { position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 0 0 1px var(--c-bg-soft); transition: transform .2s ease; }
.gh-link { display: block; text-decoration: none; color: inherit; }
.gh-info { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; padding: 10px; }
.gh-icon { font-size: 18px; opacity: .8; }
.gh-title { font-weight: 600; font-family: var(--font-monospace); word-break: break-all; }
.gh-stars { display: inline-flex; align-items: center; gap: 4px; color: #f59e0b; }
.gh-card:hover { transform: translateY(-2px); }
.gh-desc { padding: 0 10px 10px; color: var(--c-text-2); font-size: .9rem; line-height: 1.5; }
@media (max-width: 640px) {}
/* stylelint-enable */
</style>
