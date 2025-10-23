<!-- FriendLinksBanner: 友链页顶部横幅与头像走马灯（全新实现） -->
<script setup lang="ts">
import { computed } from 'vue'
import site from '~~/blog.config'
import rawGroups from '../../feeds'

interface Friend {
	author: string
	link: string
	avatar: string
	hundredSuffix?: string
	date?: string
}

interface Group {
	name: string
	entries: Friend[]
	hundredSuffix?: string
}

const origin = (site.url || '').replace(/\/$/, '')
const FALLBACK_AVATAR = 'https://img.314926.xyz/images/2025/08/19/404.gif'

function absolutize(input: string) {
	if (!input)
		return input
	if (/^https?:\/\//i.test(input) || /^\/\//.test(input))
		return input
	return input.startsWith('/') ? `${origin}${input}` : input
}

function stripBang(u: string) {
	const i = u.indexOf('!')
	return i >= 0 ? u.slice(0, i) : u
}

const pairs = computed(() => {
	const groups = rawGroups as Group[]
	const out: Array<{ left: Friend, right: Friend, leftSrc: string, rightSrc: string }> = []
	for (const g of groups) {
		const items = g.entries.slice()
		const even = items.filter((_, idx) => idx % 2 === 0)
		const odd = items.filter((_, idx) => idx % 2 === 1)
		const fallbackSuffix = g.hundredSuffix || ''
		const max = Math.min(even.length, odd.length)
		for (let i = 0; i < max; i++) {
			const a = even[i]
			const b = odd[i]
			out.push({
				left: a,
				right: b,
				leftSrc: stripBang(a.avatar) + (a.hundredSuffix || fallbackSuffix || ''),
				rightSrc: stripBang(b.avatar) + (b.hundredSuffix || fallbackSuffix || ''),
			})
		}
	}
	return out
})

function onImgError(e: Event) {
	const el = e.target as HTMLImageElement
	el.onerror = null
	el.src = absolutize(FALLBACK_AVATAR)
}
</script>

<template>
<section class="flinks card">
	<header class="flinks-hero">
		<p class="flinks-eyebrow">
			友情链接
		</p>
		<h2 class="flinks-title">
			与数百名博主无限进步
		</h2>
	</header>

	<div class="flinks-marquee" aria-label="friend links avatars">
		<div class="flinks-track">
			<template v-for="n in 2" :key="n">
				<div class="flinks-seg">
					<div
						v-for="(p, i) in pairs"
						:key="`${n}-${i}`"
						class="flinks-pair"
					>
						<a
							class="face"
							:href="absolutize(p.left.link)"
							target="_blank"
							rel="noopener"
							:title="p.left.author"
						>
							<img
								:src="absolutize(p.leftSrc)"
								:alt="p.left.author"
								class="img"
								@error="onImgError"
							>
						</a>
						<a
							class="face offset"
							:href="absolutize(p.right.link)"
							target="_blank"
							rel="noopener"
							:title="p.right.author"
						>
							<img
								:src="absolutize(p.rightSrc)"
								:alt="p.right.author"
								class="img"
								@error="onImgError"
							>
						</a>
					</div>
				</div>
			</template>
		</div>
	</div>
</section>
</template>

<style scoped>
.flinks {
	margin: 1rem;
	padding: 1.25rem;
	border: 1px solid var(--c-border, #E5E7EB);
	border-radius: 12px;
	box-shadow: 0 0.1em 0.2em var(--ld-shadow);
	background: var(--ld-bg-card);
}

.flinks-hero {
	display: grid;
	gap: 0.25rem;
}

.flinks-eyebrow {
	font-size: 12px;
	line-height: 1;
	color: var(--c-text-3);
}

.flinks-title {
	margin: 0 0 0.25rem;
	font-size: 32px;
	font-weight: 700;
	line-height: 1.1;
}

.flinks-marquee {
	overflow: hidden;
	margin-top: 1.25rem;

	/* 让跑马灯区域左右贴边：抵消父容器的卡片内边距 */
	margin-right: -1.25rem;
	margin-left: -1.25rem;
}

.flinks-track {
	display: flex;
	width: max-content;
	animation: ticker 120s linear infinite;
}

.flinks-seg {
	display: flex;
	gap: 1.25rem;
	padding-left: 0;
}

.flinks-pair {
	display: grid;
	grid-auto-flow: row;
	align-items: start;
}

.face {
	display: inline-flex;
	overflow: hidden;
	width: 120px;
	height: 120px;
	border-radius: 999px;
	box-shadow: 0 0.1em 0.2em var(--ld-shadow);
}

.face.offset {
	margin-top: 1rem;
	transform: translateX(-60px);
}

.img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

@keyframes ticker {
	to {
		transform: translateX(-50%);
	}
}

@media (max-width: 640px) {
	.flinks-title {
		font-size: 24px;
	}

	.face {
		width: 96px;
		height: 96px;
	}
}
</style>
