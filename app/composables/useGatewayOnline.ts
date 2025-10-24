import { computed, onMounted, onUnmounted, ref } from 'vue'

function getGatewayOrigin() {
	if (process.server)
		return ''
	const { public: pub } = useRuntimeConfig()
	let origin = pub.gatewayOrigin || location.origin
	try {
		const storageKey = 'gatewayOriginOverride'
		const u = new URL(location.href)
		const fromQuery = u.searchParams.get('gatewayOrigin') || u.searchParams.get('gw')
		if (fromQuery && /^https?:\/\//i.test(fromQuery)) {
			localStorage.setItem(storageKey, fromQuery)
			origin = fromQuery
		}
		else {
			const fromStorage = localStorage.getItem(storageKey)
			if (fromStorage && /^https?:\/\//i.test(fromStorage))
				origin = fromStorage
		}
	}
	catch { /* ignore */ }
	return origin
}
function toWsUrl(path: string) {
	const origin = getGatewayOrigin()
	try {
		const u = new URL(path, origin)
		if (u.protocol === 'http:')
			u.protocol = 'ws:'
		if (u.protocol === 'https:')
			u.protocol = 'wss:'
		return u.toString()
	}
	catch {
		const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
		return `${proto}//${location.host}${path}`
	}
}
function getStableSid() {
	if (process.server)
		return 'server'
	const key = 'liveRoom.sid'
	try {
		let sid = localStorage.getItem(key)
		if (!sid) {
			sid = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
			localStorage.setItem(key, sid)
		}
		return sid
	}
	catch {
		return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
	}
}

function toHttpUrl(path: string) {
	const origin = getGatewayOrigin()
	try {
		const u = new URL(path, origin)
		if (u.protocol === 'ws:')
			u.protocol = 'http:'
		if (u.protocol === 'wss:')
			u.protocol = 'https:'
		return u.toString()
	}
	catch {
		const proto = location.protocol === 'https:' ? 'https:' : 'http:'
		return `${proto}//${location.host}${path}`
	}
}

export function useGatewayOnline() {
	const online = ref(0)
	const connecting = ref(false)
	const connected = ref(false)
	const error = ref<string | null>(null)

	// 调试开关：localStorage.presenceDebug = '1'|'true'
	const isDebug = () => {
		if (process.server)
			return false
		try {
			const v = String(localStorage.getItem('presenceDebug') || '').toLowerCase()
			return v === '1' || v === 'true'
		}
		catch { return false }
	}

    let ws: WebSocket | null = null
    let retryTimer: number | null = null
    let backoff = 1000
    // 优先使用新的 /ws，其次兼容别名
    const paths: string[] = ['/ws', '/v1/ws', '/v1/ws/web', '/web']
    let pathIndex = 0
    let failCount = 0
    let pollTimer: number | null = null

	const cleanup = () => { if (retryTimer != null) { clearTimeout(retryTimer); retryTimer = null } }
    const schedule = () => {
        cleanup()
        if (process.server)
            return
        retryTimer = window.setTimeout(() => {
            backoff = Math.min(backoff * 2, 10000)
            connect()
        }, backoff)
    }

	const stopPoll = () => { if (pollTimer != null) { clearInterval(pollTimer); pollTimer = null } }
    const startPoll = () => {
        if (pollTimer != null)
            return
        const run = async () => {
            try {
                const url = toHttpUrl('/v1/metrics/online')
                const data = await $fetch<{ online: number }>(url, { timeout: 3000 })
                const n = Number(data?.online)
                if (Number.isFinite(n))
                    online.value = n
            }
            catch { /* ignore */ }
        }
        run()
        pollTimer = window.setInterval(run, 8000)
    }

    const connect = () => {
        if (process.server)
            return
        try {
            if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN))
                return
            cleanup()
            connecting.value = true
            connected.value = false
            error.value = null
            const params = new URLSearchParams({ socket_session_id: getStableSid() })
            const path = paths[pathIndex] || paths[0]
            const url = toWsUrl(`${path}?${params.toString()}`)
            if (isDebug()) {
                try { console.info('[Online WS] connecting', { url }) }
                catch {}
            }
            ws = new WebSocket(url)
            ws.addEventListener('open', () => {
                connecting.value = false; connected.value = true; backoff = 1000; failCount = 0; stopPoll();
                // 可选：连接后发送稳定 ID 以更新去重标识
                try { ws?.send(JSON.stringify({ type: 'updateSid', session_id: getStableSid() })) } catch {}
                if (isDebug()) console.info('[Online WS] open')
            })
            ws.addEventListener('message', (evt) => {
                try {
                    const raw = JSON.parse(String(evt.data) || '{}') as any
                    const t = raw?.type
                    if (!t) return
                    // 新协议：hello/sync
                    if (t === 'hello' || t === 'sync') {
                        const n = Number(raw?.count)
                        if (Number.isFinite(n)) online.value = n
                        return
                    }
                    // 兼容旧协议（如存在）
                    if (t === 'VISITOR_ONLINE' || t === 'VISITOR_OFFLINE') {
                        const n = Number(raw?.data?.online)
                        if (Number.isFinite(n)) online.value = n
                    }
                }
                catch { /* ignore */ }
            })
            ws.addEventListener('error', (ev) => {
                error.value = 'ws-error'
                if (isDebug()) {
                    try { console.error('[Online WS] error event:', ev) }
                    catch {}
                }
            })
            ws.addEventListener('close', (e: CloseEvent) => {
                if (isDebug()) {
                    try {
                        console.warn('[Online WS] closed', {
                            url: ws?.url,
                            code: e.code,
                            reason: e.reason,
                            wasClean: e.wasClean,
                            pathTried: paths[pathIndex] || paths[0],
                        })
                    }
                    catch {}
                }
                connecting.value = false
                connected.value = false
                failCount += 1
                if (failCount >= 2)
                    startPoll()
                // 尝试下一个兼容路径
                pathIndex = (pathIndex + 1) % paths.length
                schedule()
            })
        }
        catch (e: any) {
            connecting.value = false
            connected.value = false
            error.value = e?.message || 'ws-init-failed'
            schedule()
        }
    }

	onMounted(() => {
		// 允许通过 URL 查询参数开启调试：?presenceDebug=1
		try {
			const u = new URL(location.href)
			const q = u.searchParams.get('presenceDebug')
			if (q === '1' || q === 'true')
				localStorage.setItem('presenceDebug', '1')
		}
		catch {}
		connect()
	})
	onUnmounted(() => {
		cleanup(); stopPoll(); if (ws) {
			try { ws.close() }
			catch {} ws = null
		}
	})

	return {
		count: computed(() => online.value),
		connecting: computed(() => connecting.value),
		connected: computed(() => connected.value),
		error: computed(() => error.value),
		reconnect: () => connect(),
	}
}
