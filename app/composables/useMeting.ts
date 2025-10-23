export const METING_API = 'https://meting.qjqq.cn/?server=:server&type=:type&id=:id'

export function useMetingAssets() {
	const aplayerReady = ref(false)

	function addLinkOnce(id: string, href: string) {
		if (document.getElementById(id))
			return
		const link = document.createElement('link')
		link.id = id
		link.rel = 'stylesheet'
		link.href = href
		document.head.appendChild(link)
	}

	function loadScriptOnce(id: string, src: string) {
		return new Promise<void>((resolve, reject) => {
			const existed = document.getElementById(id) as HTMLScriptElement | null
			if (existed) {
				if ((existed as any)._loaded)
					return resolve()
				existed.addEventListener('load', () => resolve())
				existed.addEventListener('error', () => reject(new Error(`load fail: ${src}`)))
				return
			}
			const s = document.createElement('script')
			s.id = id
			s.src = src
			s.defer = true
			; (s as any)._loaded = false
			s.onload = () => { (s as any)._loaded = true; resolve() }
			s.onerror = () => reject(new Error(`load fail: ${src}`))
			document.body.appendChild(s)
		})
	}

	async function ensureMetingAssets() {
		if (!import.meta.client)
			return
		const cssCdnList = [
			'https://cdn.staticfile.org/aplayer/1.10.1/APlayer.min.css',
			'https://unpkg.com/aplayer/dist/APlayer.min.css',
			'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css',
		]
		const jsAPlayerList = [
			'https://s4.zstatic.net/ajax/libs/aplayer/1.10.1/APlayer.min.js',
			'https://cdnjs.snrat.com/ajax/libs/aplayer/1.10.1/APlayer.min.js',
			'https://use.sevencdn.com/ajax/libs/aplayer/1.10.1/APlayer.min.js',
		]
		const jsMetingList = [
			'https://s4.zstatic.net/ajax/libs/meting/2.0.2/Meting.min.js',
			'https://cdnjs.snrat.com/ajax/libs/meting/2.0.2/Meting.min.js',
			'https://use.sevencdn.com/ajax/libs/meting/2.0.2/Meting.min.js',
		]
		async function tryList(id: string, list: string[], isCss = false) {
			for (const url of list) {
				try {
					if (isCss)
						addLinkOnce(id, url)
					else await loadScriptOnce(id, url)
					return true
				}
				catch (e) {
					console.warn(`[meting] 资源加载失败，尝试下一个: ${url}`, e)
				}
			}
			return false
		}
		const cssOk = await tryList('aplayer-css', cssCdnList, true)
		const js1Ok = await tryList('aplayer-js', jsAPlayerList)
		const js2Ok = await tryList('meting-js', jsMetingList)
		aplayerReady.value = cssOk && js1Ok && js2Ok
		if (!aplayerReady.value)
			console.error('[meting] 资源加载失败（全部CDN不可用）')
	}

	return { METING_API, aplayerReady, ensureMetingAssets }
}
