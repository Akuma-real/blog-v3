<script setup lang="ts">
const appConfig = useAppConfig()
const timeEstablished = appConfig.timeEstablished

const blogLog = [
	{ label: '2025-09-15', value: '更换博客到Clarity' },
	{ label: timeEstablished, value: '开始正式拥有自己的博客' },
]
</script>

<template>
<ZWidget card title="更新日志">
	<ZDlGroup size="large" :items="blogLog" />
</ZWidget>
</template>
