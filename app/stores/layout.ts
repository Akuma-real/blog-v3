const defaultState = {
	sidebar: false,
	aside: false,
	search: false,
}

type LayoutSection = keyof typeof defaultState

export const useLayoutStore = defineStore('layout', () => {
	const open = ref({ ...defaultState })
	const isAnyOpen = computed(() => Object.values(open.value).some(Boolean))

	const asideWidgets = ref<WidgetName[]>([])
	const baseAsideWidgets: WidgetName[] = ['visitor-ip']

	const closeAll = () => {
		Object.keys(open.value).forEach((key) => {
			open.value[key as LayoutSection] = false
		})
	}

	const toggle = (key: LayoutSection) => {
		const isActive = open.value[key]
		closeAll()
		open.value[key] = !isActive
	}

	const setAside = (widgets?: WidgetName[]) => {
		if (widgets === undefined)
			return
		const nextWidgets = [...new Set([...baseAsideWidgets, ...widgets])] as WidgetName[]
		asideWidgets.value = nextWidgets
	}

	const isOpen = (key: LayoutSection) => open.value[key]

	return {
		open,
		isAnyOpen,
		asideWidgets,
		closeAll,
		toggle,
		setAside,
		isOpen,
	}
})
