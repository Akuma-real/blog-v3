interface UsePaginationOptions {
	initialPage?: number
	perPage?: number
	bindQuery?: string | false
}

export default function usePagination<T>(list: MaybeRefOrGetter<T[]>, options?: UsePaginationOptions) {
	const appConfig = useAppConfig()
	const {
		initialPage = 1,
		perPage = appConfig.pagination.perPage || 10,
		bindQuery = false,
	} = options ?? {}

	// 创建页码 ref，根据是否绑定查询参数决定类型
	const rawPage = bindQuery
		? useRouteQuery(bindQuery, initialPage.toString(), { mode: 'push' })
		: ref(initialPage)

	// 确保返回的 page 始终是数字类型
	const page = computed({
		get: () => bindQuery ? Number(rawPage.value) : rawPage.value as number,
		set: (val: number) => {
			rawPage.value = bindQuery ? val.toString() : val
		},
	})

	const totalPages = computed(() => Math.ceil(toValue(list).length / perPage) || initialPage)

	// 验证页码范围
	watch([page, totalPages], ([newPage, newTotal]) => {
		if (newPage < 1 || newPage > newTotal) {
			page.value = initialPage
		}
	}, { immediate: true })

	const listPaged = computed(() => {
		const start = (toValue(page) - 1) * perPage
		return toValue(list).slice(start, start + perPage)
	})

	return {
		totalPages,
		page,
		listPaged,
	}
}

/**
 * 生成分页数组
 *
 * 根据当前页码、扩展范围和总页数，生成一个用于显示的分页数组，包含起始页、结束页和省略符号位置。
 *
 * @param current 当前页码
 * @param total 总页数
 * @param expand 当前页码的扩展范围，默认值为1
 * @returns  返回一个包含可显示页码的数组。
 * 数组中的 `Number.NEGATIVE_INFINITY` 表示向前省略页码符号（...）的位置；
 * 数组中的 `Number.POSITIVE_INFINITY` 表示向后省略页码符号（...）的位置。
 *
 */
export function genPageArr(current: number, total: number, expand: number = 1) {
	const start = Math.max(2, Math.min(current - expand, total - 2 * expand))
	const end = Math.min(total, start + 2 * expand)
	const pageArr = Array.from({ length: end - start + 1 }, (_, i) => start + i)
	start > 2 && pageArr.unshift(Number.NEGATIVE_INFINITY)
	start > 1 && pageArr.unshift(1)
	end < total - 1 && pageArr.push(Number.POSITIVE_INFINITY)
	end < total && pageArr.push(total)
	return pageArr
}
