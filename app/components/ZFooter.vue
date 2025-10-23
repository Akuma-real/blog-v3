<script setup lang="ts">
const appConfig = useAppConfig()
const { count: liveCount, connecting } = useLiveRoom({ room: 'global' })
</script>

<template>
<footer class="z-footer">
	<nav class="footer-nav">
		<div v-for="(group, groupIndex) in appConfig.footer.nav" :key="groupIndex" class="footer-nav-group">
			<h3 v-if="group.title">
				{{ group.title }}
			</h3>
			<menu>
				<li v-for="(item, itemIndex) in group.items" :key="itemIndex">
					<ZRawLink :to="item.url">
						<Icon :name="item.icon" />
						<span class="nav-text">{{ item.text }}</span>
					</ZRawLink>
				</li>
			</menu>
		</div>
	</nav>
	<div class="footer-meta">
		<p class="online" aria-live="polite">
			<span class="dot" :class="{ on: !connecting }" aria-hidden="true" />
			在线 {{ liveCount }} 人
		</p>
		<p v-html="appConfig.footer.copyright" />
	</div>
</footer>
</template>

<style lang="scss" scoped>
.z-footer {
	margin: 3rem 1rem;
	font-size: 0.9em;
	color: var(--c-text-2);

	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 5vw clamp(2rem, 5%, 5vw);
		padding-block: 3rem;

		h3 {
			margin: 0.5em;
			font: inherit;
		}

		a {
			display: flex;
			align-items: center;
			gap: 0.3em;
			width: fit-content;
			padding: 0.3em 0.5em;
			border-radius: 0.5em;
			font-size: 0.9em;
			transition: background-color 0.2s, color 0.1s;

			&:hover {
				background-color: var(--c-bg-soft);
				color: var(--c-text);
			}
		}
	}

	.footer-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
	}

	.footer-meta p {
		margin: 0.5em;
	}

	.online {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.2em 0.6em;
		border-radius: 999px;
		background: color-mix(in srgb, var(--c-primary) 10%, transparent);
		font-size: 0.85em;
		color: var(--c-primary);
	}

	.online .dot {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--c-primary) 12%, transparent);
		background: var(--c-text-3);
	}

	.online .dot.on {
		background: var(--c-primary);
	}
}
</style>
