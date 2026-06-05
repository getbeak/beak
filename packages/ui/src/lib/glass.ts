/**
 * Shared "glassy floating surface" recipe.
 *
 * Every overlay surface in the renderer — context menus, dropdowns,
 * dialogs, popovers, tooltips, toasts — uses the same translucent +
 * backdrop-blur look so they read as one design vocabulary rather
 * than a dozen hand-rolled card styles.
 *
 * Two flavours are exported:
 *   - `glassChakraProps[tone]` — Chakra Box-style prop bag, for any
 *     surface rendered via Chakra primitives.
 *   - `glassInlineStyle[tone]` — raw `React.CSSProperties`, for hand-
 *     rolled portals or `style={…}` strings.
 *
 * Tones tune blur + shadow weight per density. They share the same
 * fill+border recipe so the visual family stays coherent.
 */
import type * as React from 'react';

type Tone = 'menu' | 'dialog' | 'popover' | 'tooltip' | 'toast';

const fill = (alphaPct: number) => `color-mix(in srgb, var(--beak-colors-bg-surface) ${alphaPct}%, transparent)`;

const border = (alphaPct: number) => `color-mix(in srgb, var(--beak-colors-border-default) ${alphaPct}%, transparent)`;

const shadows = {
	menu: [
		'0 1px 0 0 color-mix(in srgb, white 6%, transparent) inset',
		'0 0 0 0.5px color-mix(in srgb, black 25%, transparent)',
		'0 12px 24px -6px rgba(0, 0, 0, 0.28)',
		'0 24px 48px -12px rgba(0, 0, 0, 0.34)',
	].join(', '),
	popover: [
		'0 1px 0 0 color-mix(in srgb, white 6%, transparent) inset',
		'0 0 0 0.5px color-mix(in srgb, black 25%, transparent)',
		'0 16px 32px -8px rgba(0, 0, 0, 0.30)',
		'0 32px 64px -16px rgba(0, 0, 0, 0.34)',
	].join(', '),
	dialog: [
		'0 1px 0 0 color-mix(in srgb, white 7%, transparent) inset',
		'0 0 0 0.5px color-mix(in srgb, black 30%, transparent)',
		'0 24px 48px -12px rgba(0, 0, 0, 0.36)',
		'0 48px 96px -24px rgba(0, 0, 0, 0.42)',
	].join(', '),
	tooltip: [
		'0 1px 0 0 color-mix(in srgb, white 5%, transparent) inset',
		'0 0 0 0.5px color-mix(in srgb, black 22%, transparent)',
		'0 4px 12px -2px rgba(0, 0, 0, 0.26)',
		'0 10px 20px -6px rgba(0, 0, 0, 0.30)',
	].join(', '),
	toast: [
		'0 1px 0 0 color-mix(in srgb, white 6%, transparent) inset',
		'0 0 0 0.5px color-mix(in srgb, black 25%, transparent)',
		'0 16px 32px -8px rgba(0, 0, 0, 0.30)',
		'0 32px 64px -16px rgba(0, 0, 0, 0.34)',
	].join(', '),
} as const;

const blur = {
	menu: 'blur(28px) saturate(180%)',
	popover: 'blur(28px) saturate(180%)',
	dialog: 'blur(36px) saturate(180%)',
	tooltip: 'blur(20px) saturate(180%)',
	toast: 'blur(28px) saturate(180%)',
} as const;

const fillStrength: Record<Tone, number> = {
	menu: 72,
	popover: 76,
	dialog: 78,
	tooltip: 70,
	toast: 76,
};

const borderStrength: Record<Tone, number> = {
	menu: 70,
	popover: 70,
	dialog: 70,
	tooltip: 60,
	toast: 70,
};

export interface GlassChakraProps {
	bg: string;
	borderWidth: string;
	borderColor: string;
	backdropFilter: string;
	boxShadow: string;
}

function makeChakraProps(tone: Tone): GlassChakraProps {
	return {
		bg: fill(fillStrength[tone]),
		borderWidth: '1px',
		borderColor: border(borderStrength[tone]),
		backdropFilter: blur[tone],
		boxShadow: shadows[tone],
	};
}

function makeInlineStyle(tone: Tone): React.CSSProperties {
	return {
		background: fill(fillStrength[tone]),
		border: `1px solid ${border(borderStrength[tone])}`,
		backdropFilter: blur[tone],
		// biome-ignore lint/style/useNamingConvention: React inline-style prefix
		WebkitBackdropFilter: blur[tone],
		boxShadow: shadows[tone],
	};
}

export const glassChakraProps: Record<Tone, GlassChakraProps> = {
	menu: makeChakraProps('menu'),
	popover: makeChakraProps('popover'),
	dialog: makeChakraProps('dialog'),
	tooltip: makeChakraProps('tooltip'),
	toast: makeChakraProps('toast'),
};

export const glassInlineStyle: Record<Tone, React.CSSProperties> = {
	menu: makeInlineStyle('menu'),
	popover: makeInlineStyle('popover'),
	dialog: makeInlineStyle('dialog'),
	tooltip: makeInlineStyle('tooltip'),
	toast: makeInlineStyle('toast'),
};
