import type { AlertSeverity } from '@beak/ui/store/project/types';
import { AlertOctagon, AlertTriangle, Info, type LucideIcon } from 'lucide-react';

/**
 * Per-severity presentation tokens. Centralised so every surface (status
 * strip, row flair, inline banner, panel item, toast) reads the same
 * colour, icon, and copy — flipping a severity's accent here updates
 * everything at once.
 */
export interface SeverityPreset {
	icon: LucideIcon;
	accentToken: 'alert' | 'warning' | 'indigo';
	accentVar: string;
	label: string;
	pluralLabel: string;
}

export const SEVERITY_PRESETS: Record<AlertSeverity, SeverityPreset> = {
	error: {
		icon: AlertOctagon,
		accentToken: 'alert',
		accentVar: 'var(--beak-colors-accent-alert)',
		label: 'Error',
		pluralLabel: 'Errors',
	},
	warning: {
		icon: AlertTriangle,
		accentToken: 'warning',
		accentVar: 'var(--beak-colors-accent-warning)',
		label: 'Warning',
		pluralLabel: 'Warnings',
	},
	notice: {
		icon: Info,
		accentToken: 'indigo',
		accentVar: 'var(--beak-colors-accent-indigo)',
		label: 'Notice',
		pluralLabel: 'Notices',
	},
};

/**
 * Rank used for "highest wins" decisions on the row/tab flair. `error`
 * dominates `warning` dominates `notice`; nothing maps to 0 so a clean
 * row resolves to `null` not a severity.
 */
export const SEVERITY_RANK: Record<AlertSeverity, number> = {
	error: 3,
	warning: 2,
	notice: 1,
};

export function pickHigherSeverity(a: AlertSeverity, b: AlertSeverity): AlertSeverity {
	return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}
