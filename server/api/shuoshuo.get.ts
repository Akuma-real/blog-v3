interface ShuoItemImage {
	id?: number
	image_source?: string
	image_url?: string
	message_id?: number
}

interface ShuoItem {
	id: number
	content: string
	username?: string
	private?: boolean
	user_id?: number
	fav_count?: number
	created_at?: string
	images?: ShuoItemImage[]
}

interface ShuoResponse {
	total: number
	items: ShuoItem[]
}

export default defineEventHandler(async (event): Promise<ShuoResponse> => {
	const query = getQuery(event)
	const page = Number(query.page || 1)
	const pageSize = Number(query.pageSize || 20)

	try {
		// 参考 https://memo.june.ink/swagger/index.html → /api/echo/page
		const remote = await $fetch<{ code?: number, msg?: string, data?: { total?: number, items?: ShuoItem[] } }>('https://memo.june.ink/api/echo/page', {
			query: { page, pageSize },
		})

		if (!remote || typeof remote !== 'object') {
			return { total: 0, items: [] } as ShuoResponse
		}

		// 远端统一返回 { code, msg, data: { total, items } }
		const data = remote.data || {}
		const total = Number(data.total || 0)
		const items = Array.isArray(data.items) ? (data.items as any[]).map((it) => {
			// 根据 Swagger 文档（model.Echo.fav_count: integer），后端应返回整数。
			// 为防止偶发的类型不一致（如字符串"0"），在服务端统一归一化为 number，避免前端显示异常。
			const fav = typeof it?.fav_count === 'number' ? it.fav_count : Number(it?.fav_count ?? 0) || 0
			return { ...it, fav_count: fav } as ShuoItem
		}) : []

		return { total, items } as ShuoResponse
	}
	catch (error) {
		console.error('[shuoshuo] 获取失败:', error)
		return { total: 0, items: [] } as ShuoResponse
	}
})
