import { computed, onMounted, onUnmounted, ref } from 'vue'

interface HelloMsg { type: 'hello', sid: string, ttl?: number, count: number }
interface SyncMsg { type: 'sync', count: number }
type InboundMsg = HelloMsg | SyncMsg | { type?: string, [k: string]: any }

export interface UseLiveRoomOptions { room?: string }

// 单例连接表：同一房间只建一个 WS 连接，避免同页多处使用导致人数+2
interface Conn {
	room: string
	ws: WebSocket | null
	count: ReturnType<typeof ref<number>>
	connecting: ReturnType<typeof ref<boolean>>
	connected: ReturnType<typeof ref<boolean>>
	error: ReturnType<typeof ref<string | null>>
	hbTimer: number | null
	reconnectTimer: number | null
	backoff: number
	refs: number
	// cross-tab 协调
	bc: BroadcastChannel | null
	isLeader: boolean
	leaderBeatTimer: number | null
	lastLeaderTs: number
	ensureConnected: () => void
	ensurePresence: () => void
	stepDown: () => void
	release: () => void
}

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
		// 兜底：相对路径
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
const conns = new Map<string, Conn>()
const TAB_ID = (() => {
	if (process.server)
		return 'server'
	try {
		const key = 'liveRoom.tabId'
		let id = sessionStorage.getItem(key)
		if (!id) {
			id = (globalThis.crypto?.randomUUID?.() ?? `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`)
			sessionStorage.setItem(key, id)
		}
		return id
	}
	catch {
		return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
	}
})()

function createConn(room: string): Conn {
	const count = ref(0)
	const connecting = ref(false)
	const connected = ref(false)
	const error = ref<string | null>(null)
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
	let hbTimer: number | null = null
	let reconnectTimer: number | null = null
	let backoff = 1000
	let bc: BroadcastChannel | null = null
	let isLeader = false
	let leaderBeatTimer: number | null = null
	let lastLeaderTs = 0

	const cleanupTimers = () => {
		if (hbTimer != null) { clearInterval(hbTimer); hbTimer = null }
		if (reconnectTimer != null) { clearTimeout(reconnectTimer); reconnectTimer = null }
	}

	const isActive = () => !!ws && ws.readyState === WebSocket.OPEN

	const sendHeartbeat = () => {
		try {
			if (isActive())
				ws!.send(JSON.stringify({ type: 'hb' }))
		}
		catch { scheduleReconnect() }
	}

	const startHeartbeat = (ttl?: number) => {
		const ms = !ttl || !Number.isFinite(ttl) ? 15000 : Math.min(30000, Math.max(5000, ttl * 1000 - 1000))
		if (hbTimer != null)
			clearInterval(hbTimer)
		hbTimer = window.setInterval(sendHeartbeat, ms)
	}

	const scheduleReconnect = () => {
		cleanupTimers()
		if (process.server)
			return
		// 引用计数归零或不是 leader 则不再重连
		if (conn.refs <= 0 || !isLeader)
			return
		reconnectTimer = window.setTimeout(() => {
			backoff = Math.min(backoff * 2, 10000)
			ensureConnected()
		}, backoff)
	}

	const ensureConnected = () => {
		if (process.server)
			return
		try {
			if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN))
				return
			cleanupTimers()
			connecting.value = true
			connected.value = false
			error.value = null
			const params = new URLSearchParams({ room, socket_session_id: getStableSid() })
			const url = toWsUrl(`/v1/ws?${params.toString()}`)
			if (isDebug()) {
				try { console.info('[Room WS] connecting', { room, url }) }
				catch {}
			}
			ws = new WebSocket(url)
			ws.addEventListener('open', () => {
				connecting.value = false; connected.value = true; backoff = 1000; sendHeartbeat(); if (isDebug())
					console.info('[Room WS] open', { room })
			})
			ws.addEventListener('message', (evt) => {
				try {
					const data = JSON.parse(String(evt.data)) as InboundMsg
					if (data.type === 'hello') {
						const m = data as HelloMsg; if (Number.isFinite(m.count))
							count.value = m.count; startHeartbeat(m.ttl)
					}
					else if (data.type === 'sync') {
						const m = data as SyncMsg; if (Number.isFinite(m.count))
							count.value = m.count
					}
					postState()
				}
				catch { /* ignore */ }
			})
			ws.addEventListener('error', (ev) => {
				error.value = 'ws-error'
				connected.value = false
				if (isDebug()) {
					try { console.error('[Room WS] error event:', { room, ev }) }
					catch {}
				}
				postState()
			})
			ws.addEventListener('close', (e: CloseEvent) => {
				if (isDebug()) {
					try {
						console.warn('[Room WS] closed', {
							url: ws?.url,
							room,
							code: e.code,
							reason: e.reason,
							wasClean: e.wasClean,
						})
					}
					catch {}
				}
				connecting.value = false
				connected.value = false
				postState()
				scheduleReconnect()
			})
		}
		catch (e: any) {
			connecting.value = false
			connected.value = false
			error.value = e?.message || 'ws-init-failed'
			scheduleReconnect()
		}
	}

	// ---- BroadcastChannel 协调（跨标签页去重） ----
	const ensureBC = () => {
		if (process.server)
			return null
		if (!bc && 'BroadcastChannel' in window) {
			bc = new BroadcastChannel(`live-room:${room}`)
			bc.onmessage = (ev: MessageEvent) => {
				const msg = ev.data || {}
				if (!msg || msg.room !== room)
					return
				if (msg.type === 'hb') {
					lastLeaderTs = Date.now()
					const otherId = String(msg.from)
					if (isLeader && otherId > TAB_ID) {
						// 对方优先级更高，让贤
						stepDown()
					}
				}
				else if (msg.type === 'state') {
					lastLeaderTs = Date.now()
					if (!isLeader) {
						if (Number.isFinite(msg.count))
							count.value = msg.count
						connecting.value = !!msg.connecting
						error.value = msg.error ?? null
					}
					else {
						const otherId = String(msg.from)
						if (otherId > TAB_ID)
							stepDown()
					}
				}
				else if (msg.type === 'req-sync') {
					if (isLeader)
						postState()
				}
			}
		}
		return bc
	}

	const post = (payload: any) => {
		try { ensureBC()?.postMessage(payload) }
		catch { }
	}
	const postHB = () => post({ type: 'hb', room, from: TAB_ID, ts: Date.now() })
	const postState = () => post({ type: 'state', room, from: TAB_ID, ts: Date.now(), count: count.value, connecting: connecting.value, error: error.value })

	const stepDown = () => {
		if (!isLeader)
			return
		isLeader = false
		conn.isLeader = false
		cleanupTimers()
		if (ws) {
			try { ws.close() }
			catch { }; ws = null
		}
		connecting.value = false
		connected.value = false
		postState()
	}

	const ensurePresence = () => {
		if (process.server)
			return
		ensureBC()
		// 若近期没收到 leader 心跳，则尝试竞选 leader；否则作为 follower 请求一次快照
		const now = Date.now()
		if (now - lastLeaderTs > 3000) {
			post({ type: 'req-sync', room, from: TAB_ID })
			setTimeout(() => {
				if (isLeader)
					return
				if (Date.now() - lastLeaderTs > 2800) {
					isLeader = true
					conn.isLeader = true
					ensureConnected()
					postHB()
					leaderBeatTimer = window.setInterval(postHB, 2000)
				}
			}, 200 + Math.floor(Math.random() * 150))
		}
		else {
			post({ type: 'req-sync', room, from: TAB_ID })
		}
	}

	const release = () => {
		conn.refs -= 1
		if (conn.refs <= 0) {
			cleanupTimers()
			if (ws) {
				try { ws.close() }
				catch { }; ws = null
			}
			if (bc) {
				try { bc.close() }
				catch { }; bc = null
			}
			conns.delete(room)
		}
	}

	const conn: Conn = {
		room,
		ws,
		count,
		connecting,
		connected,
		error,
		hbTimer,
		reconnectTimer,
		backoff,
		refs: 0,
		bc,
		isLeader,
		leaderBeatTimer,
		lastLeaderTs,
		ensureConnected,
		ensurePresence,
		stepDown,
		release,
	}

	return conn
}

/**
 * 极简实时在线人数（WebSocket）
 * - KISS: 单文件、最小状态，仅维护计数
 * - YAGNI: 暂不抽象事件总线/多房间复用（需要时再扩展）
 * - DRY: 心跳/重连逻辑封装在本组合式内，组件零重复
 */
export function useLiveRoom(options: UseLiveRoomOptions = {}) {
	const route = useRoute()
	const room = options.room || route.path || '/'

	// 取出或创建连接
	let conn = conns.get(room)
	if (!conn) {
		conn = createConn(room)
		conns.set(room, conn)
	}

	onMounted(() => {
		conn!.refs += 1
		conn!.ensurePresence()
	})

	onUnmounted(() => {
		conn!.release()
	})

	return {
		room,
		count: computed(() => conn!.count.value),
		connecting: computed(() => conn!.connecting.value),
		connected: computed(() => conn!.connected.value),
		error: computed(() => conn!.error.value),
		// 暴露可选操作
		connect: () => conn!.ensurePresence(),
		disconnect: () => conn!.release(),
	}
}
