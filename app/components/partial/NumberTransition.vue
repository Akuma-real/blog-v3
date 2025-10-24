<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ value: number, duration?: number }>()

const display = ref(Number.isFinite(props.value) ? Math.floor(props.value) : 0)
let raf = 0

function animate(from: number, to: number, duration = 300) {
	cancelAnimationFrame(raf)
	const start = performance.now()
	const frame = (now: number) => {
		const t = Math.min(1, (now - start) / duration)
		const eased = 1 - (1 - t) ** 3
		display.value = Math.floor(from + (to - from) * eased)
		if (t < 1)
			raf = requestAnimationFrame(frame)
	}
	raf = requestAnimationFrame(frame)
}

watch(() => props.value, (val, old) => {
	const from = Number.isFinite(old) ? Number(old) : 0
	const to = Number.isFinite(val) ? Number(val) : 0
	if (from === to)
		return
	animate(from, to, props.duration ?? 300)
})

onMounted(() => { display.value = Math.floor(props.value || 0) })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
<span>{{ display }}</span>
</template>

<style scoped>
</style>
