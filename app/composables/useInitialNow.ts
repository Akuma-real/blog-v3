export function useInitialNow() {
	return useState<number>('initial-now', () => Date.now())
}
