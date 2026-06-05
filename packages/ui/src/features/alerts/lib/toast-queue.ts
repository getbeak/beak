import type { AlertSeverity } from '@beak/ui/store/project/types';
import { useSyncExternalStore } from 'react';

/**
 * Module-scoped queue of transient toast notifications. Sits outside Redux
 * because the toasts are pure view-side ephemera — their lifecycle is "show
 * for N seconds, then forget". Storing them in the project slice would
 * pollute persistence and time-travel debugging without adding anything.
 *
 * Toasts are spawned by the alerts listener when a new error-severity
 * alert lands. Warnings and notices stay quiet (the bottom status strip +
 * row flair are their channel) so we don't drown the user in popups.
 */

export interface ToastEntry {
	id: string;
	severity: AlertSeverity;
	title: string;
	description: string;
	createdAt: number;
}

let queue: ToastEntry[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
	for (const l of listeners) l();
}

const DEFAULT_TTL_MS = 5500;

export function pushToast(entry: Omit<ToastEntry, 'id' | 'createdAt'>, ttlMs: number = DEFAULT_TTL_MS): string {
	const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const full: ToastEntry = { ...entry, id, createdAt: Date.now() };
	queue = [...queue, full];
	emit();
	const timer = setTimeout(() => dismissToast(id), ttlMs);
	timers.set(id, timer);
	return id;
}

export function dismissToast(id: string) {
	const before = queue.length;
	queue = queue.filter(t => t.id !== id);
	const t = timers.get(id);
	if (t) {
		clearTimeout(t);
		timers.delete(id);
	}
	if (queue.length !== before) emit();
}

function subscribe(l: () => void) {
	listeners.add(l);
	return () => {
		listeners.delete(l);
	};
}

const getSnapshot = () => queue;

export function useToastQueue(): ToastEntry[] {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
