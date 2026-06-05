export function formatRelative(iso: string, now: number = Date.now()): string {
	const then = Date.parse(iso);
	if (!Number.isFinite(then)) return iso;
	const seconds = Math.max(0, Math.round((now - then) / 1000));
	if (seconds < 45) return 'just now';
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 7) return `${days}d ago`;
	const weeks = Math.round(days / 7);
	if (weeks < 5) return `${weeks}w ago`;
	const months = Math.round(days / 30);
	if (months < 12) return `${months}mo ago`;
	const years = Math.round(days / 365);
	return `${years}y ago`;
}

export function basename(p: string): string {
	if (!p) return '';
	const parts = p.split(/[\\/]/).filter(Boolean);
	return parts[parts.length - 1] ?? p;
}

export function shortenPath(p: string, maxParts: number = 3): string {
	if (!p) return '';
	const parts = p.split(/[\\/]/).filter(Boolean);
	if (parts.length <= maxParts) return p;
	return `…/${parts.slice(parts.length - maxParts).join('/')}`;
}
