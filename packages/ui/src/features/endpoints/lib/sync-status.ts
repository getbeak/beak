export type SyncStatus = 'never' | 'fresh' | 'stale';

const DAY_MS = 24 * 60 * 60 * 1000;

export function describeSync(lastSyncedAt: string | undefined): { status: SyncStatus; label: string } {
	if (!lastSyncedAt) return { status: 'never', label: 'Never synced' };
	const at = Date.parse(lastSyncedAt);
	if (!Number.isFinite(at)) return { status: 'never', label: 'Never synced' };
	const ageMs = Date.now() - at;
	const minutes = Math.floor(ageMs / 60_000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	const label =
		minutes < 1
			? 'Synced just now'
			: minutes < 60
				? `Synced ${minutes}m ago`
				: hours < 24
					? `Synced ${hours}h ago`
					: `Synced ${days}d ago`;
	const status: SyncStatus = ageMs < DAY_MS ? 'fresh' : 'stale';
	return { status, label };
}
