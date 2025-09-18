import { differenceInMilliseconds, format, formatDistanceToNow } from 'date-fns'
import { dateLocale } from '~~/blog.config'

function normalizeDate(date?: string | Date) {
	if (typeof date === 'string')
		return new Date(date)
	return date
}

function resolveNow(now: Date | number) {
	return typeof now === 'number' ? new Date(now) : now
}

export function getIsoDatetime(date?: string | Date) {
	if (!date)
		return date || undefined

	const normalized = normalizeDate(date)
	return normalized?.toISOString()
}

export function getLocaleDatetime(date?: string | Date) {
	if (!date)
		return ''

	const normalized = normalizeDate(date)
	return normalized ? format(normalized, 'yyyy年M月d日 E HH:mm:ss', { locale: dateLocale }) : ''
}

export function getPostDate(date?: string | Date, now: Date | number = new Date()) {
	if (!date)
		return ''

	const normalized = normalizeDate(date)
	if (!normalized)
		return ''

	const baseNow = resolveNow(now)

	const isWithinAWeek = differenceInMilliseconds(baseNow, normalized) < 1000 * 60 * 60 * 24 * 7
	if (isWithinAWeek)
		return formatDistanceToNow(normalized, { addSuffix: true, locale: dateLocale })

	if (isSameYear(baseNow, normalized))
		return format(normalized, 'M月d日')

	return format(normalized, 'yy年M月d日')
}

export function getReadingTime(ms: number): string {
	return formatDistanceToNow(new Date().getTime() - ms, { locale: dateLocale })
}

export function isTimeDiffSignificant(
	date1?: string | Date,
	date2?: string | Date,
	threshold: number = 0.6,
	now: Date | number = new Date(),
) {
	if (!date1 || !date2)
		return false

	const normalized1 = normalizeDate(date1)
	const normalized2 = normalizeDate(date2)
	if (!normalized1 || !normalized2)
		return false

	const baseNow = resolveNow(now)

	const diff1 = differenceInMilliseconds(baseNow, normalized1)
	const diff2 = differenceInMilliseconds(baseNow, normalized2)
	return diff1 / diff2 < threshold || diff2 / diff1 < threshold
}

export function isSameYear(date1?: string | Date, date2?: string | Date) {
	if (!date1 || !date2)
		return false
	const normalized1 = normalizeDate(date1)
	const normalized2 = normalizeDate(date2)
	if (!normalized1 || !normalized2)
		return false
	return normalized1.getFullYear() === normalized2.getFullYear()
}

export function timeElapse(date?: Date | string, maxDepth = 2, now: Date | number = Date.now()) {
	if (!date)
		return ''
	const normalized = normalizeDate(date)
	if (!normalized)
		return ''

	const baseNow = typeof now === 'number' ? now : now.getTime()
	const msecPast = baseNow - normalized.getTime()
	const intervals = [
		{ label: '世纪', threshold: 1000 * 60 * 60 * 24 * 365.2422 * 100 },
		{ label: '年', threshold: 1000 * 60 * 60 * 24 * 365.2422 },
		{ label: '个月', threshold: 1000 * 60 * 60 * 24 * 30.44 },
		{ label: '天', threshold: 1000 * 60 * 60 * 24 },
		{ label: '小时', threshold: 1000 * 60 * 60 },
		{ label: '分', threshold: 1000 * 60 },
		{ label: '秒', threshold: 1000 },
	]
	let timeString = ''
	let msecRemained = msecPast
	for (const interval of intervals) {
		const count = Math.floor(msecRemained / interval.threshold)
		if (count <= 0)
			continue
		timeString += `${count}${interval.label}`
		msecRemained -= count * interval.threshold
		if (--maxDepth <= 0)
			break
	}
	return timeString || '刚刚'
}
