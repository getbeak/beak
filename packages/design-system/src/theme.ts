import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * Beak's Chakra v3 design tokens.
 *
 * ## Colour system
 *
 * Each colour family ships as a numbered ramp (50 → 950) so callers can
 * reach for `gray.300` or `pink.700` directly. The 500 step is the
 * "core" of the colour. Lower numbers are lighter, higher are darker —
 * matching Tailwind / Radix conventions, which most contributors
 * already know.
 *
 * Families:
 *   gray   — refined cool slate; subtle blue undertone deepens into the dark end
 *   blue   — system blue (informational)
 *   pink   — Beak brand pink, a confident rose (primary)
 *   teal   — Beak brand teal, refined aqua (success / GET)
 *   indigo — Beak brand indigo, Apple-system leaning (focus / PUT-PATCH)
 *   red    — alert / DELETE
 *   green  — success (in addition to teal)
 *   yellow — warning
 *   orange — caution (3xx redirects)
 *
 * Brand aliases (`brand.pink`, `brand.teal`, …) and accent semantic
 * tokens (`accent.pink`, `accent.pink.muted`, …) all resolve from these
 * ramps, so existing call sites keep working without a sweeping rename.
 *
 * ## Semantic tokens
 *
 * macOS-style layered backgrounds (canvas → surface → emphasized) and a
 * 4-level foreground hierarchy (default / muted / subtle / disabled) cover
 * almost every UI need without callers reaching for raw scale values.
 *
 * Each semantic token resolves light vs dark via Chakra's `_dark` selector.
 * Light mode uses near-white backgrounds + near-black text. Dark mode
 * uses a deep cool gray (gray.950, gray.900) for surfaces — close to
 * the macOS "vibrant dark" appearance.
 */

const colors = {
	gray: {
		'50': { value: '#F8F9FB' },
		'100': { value: '#F0F2F5' },
		'200': { value: '#E2E5EA' },
		'300': { value: '#C7CCD5' },
		'400': { value: '#8E94A2' },
		'500': { value: '#5F6573' },
		'600': { value: '#404654' },
		'700': { value: '#2A2F3B' },
		'800': { value: '#1A1D27' },
		'850': { value: '#14171F' },
		'900': { value: '#0F1219' },
		'950': { value: '#080A11' },
	},
	pink: {
		'50': { value: '#FDF3F7' },
		'100': { value: '#FBE3EE' },
		'200': { value: '#F6C2D7' },
		'300': { value: '#EE99B6' },
		'400': { value: '#E47497' },
		'500': { value: '#DA4D7C' },
		'600': { value: '#BB3C68' },
		'700': { value: '#952F54' },
		'800': { value: '#6D243F' },
		'900': { value: '#481A2A' },
		'950': { value: '#281019' },
	},
	teal: {
		'50': { value: '#ECFDF7' },
		'100': { value: '#CDF8E7' },
		'200': { value: '#9CEFCE' },
		'300': { value: '#65E0AE' },
		'400': { value: '#36C896' },
		'500': { value: '#1FB58F' },
		'600': { value: '#16906F' },
		'700': { value: '#117055' },
		'800': { value: '#0C5240' },
		'900': { value: '#08362A' },
		'950': { value: '#041D16' },
	},
	indigo: {
		'50': { value: '#EEEEFE' },
		'100': { value: '#DDDDFC' },
		'200': { value: '#BBBBF8' },
		'300': { value: '#9392EE' },
		'400': { value: '#706FDD' },
		'500': { value: '#5856D6' },
		'600': { value: '#4644BD' },
		'700': { value: '#3837A0' },
		'800': { value: '#2A2A7B' },
		'900': { value: '#1E1E5A' },
		'950': { value: '#11102F' },
	},
	red: {
		'50': { value: '#FEF2F2' },
		'100': { value: '#FEE2E2' },
		'200': { value: '#FECACA' },
		'300': { value: '#FCA5A5' },
		'400': { value: '#F87171' },
		'500': { value: '#EF4444' },
		'600': { value: '#DC2626' },
		'700': { value: '#B91C1C' },
		'800': { value: '#991B1B' },
		'900': { value: '#7F1D1D' },
		'950': { value: '#450A0A' },
	},
	yellow: {
		'50': { value: '#FEFCE8' },
		'100': { value: '#FEF9C3' },
		'200': { value: '#FEF08A' },
		'300': { value: '#FDE047' },
		'400': { value: '#FACC15' },
		'500': { value: '#EAB308' },
		'600': { value: '#CA8A04' },
		'700': { value: '#A16207' },
		'800': { value: '#854D0E' },
		'900': { value: '#713F12' },
		'950': { value: '#422006' },
	},
	green: {
		'50': { value: '#F0FDF4' },
		'100': { value: '#DCFCE7' },
		'200': { value: '#BBF7D0' },
		'300': { value: '#86EFAC' },
		'400': { value: '#4ADE80' },
		'500': { value: '#22C55E' },
		'600': { value: '#16A34A' },
		'700': { value: '#15803D' },
		'800': { value: '#166534' },
		'900': { value: '#14532D' },
		'950': { value: '#052E16' },
	},
	orange: {
		'50': { value: '#FFF7ED' },
		'100': { value: '#FFEDD5' },
		'200': { value: '#FED7AA' },
		'300': { value: '#FDBA74' },
		'400': { value: '#FB923C' },
		'500': { value: '#F97316' },
		'600': { value: '#EA580C' },
		'700': { value: '#C2410C' },
		'800': { value: '#9A3412' },
		'900': { value: '#7C2D12' },
		'950': { value: '#431407' },
	},
	blue: {
		'50': { value: '#EFF6FF' },
		'100': { value: '#DBEAFE' },
		'200': { value: '#BFDBFE' },
		'300': { value: '#93C5FD' },
		'400': { value: '#60A5FA' },
		'500': { value: '#3B82F6' },
		'600': { value: '#2563EB' },
		'700': { value: '#1D4ED8' },
		'800': { value: '#1E40AF' },
		'900': { value: '#1E3A8A' },
		'950': { value: '#172554' },
	},
	// Brand aliases — point at the 500 step of each scale. Kept so existing
	// callers reading `{colors.brand.pink}` keep working unchanged.
	brand: {
		pink: { value: '{colors.pink.500}' },
		teal: { value: '{colors.teal.500}' },
		indigo: { value: '{colors.indigo.600}' },
		alert: { value: '{colors.red.500}' },
		success: { value: '{colors.green.500}' },
		warning: { value: '{colors.yellow.500}' },
	},
};

const config = defineConfig({
	cssVarsPrefix: 'beak',
	theme: {
		tokens: {
			colors,
			fonts: {
				body: {
					value:
						'-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
				},
				heading: {
					value:
						'-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
				},
				mono: {
					value: '"SF Mono", "Cascadia Code", "Roboto Mono", "Source Code Pro", monospace',
				},
			},
			spacing: {
				'0.5': { value: '2px' },
				'1': { value: '4px' },
				'1.5': { value: '6px' },
				'2': { value: '8px' },
				'2.5': { value: '10px' },
				'3': { value: '12px' },
				'4': { value: '16px' },
				'5': { value: '20px' },
				'6': { value: '24px' },
				'8': { value: '32px' },
				'10': { value: '40px' },
				'12': { value: '48px' },
			},
			radii: {
				none: { value: '0' },
				xs: { value: '2px' },
				sm: { value: '4px' },
				md: { value: '6px' },
				lg: { value: '8px' },
				xl: { value: '12px' },
				full: { value: '9999px' },
			},
			fontSizes: {
				xs: { value: '11px' },
				sm: { value: '12px' },
				md: { value: '13px' },
				lg: { value: '14px' },
				xl: { value: '16px' },
				'2xl': { value: '20px' },
				'3xl': { value: '24px' },
				'4xl': { value: '30px' },
			},
		},
		semanticTokens: {
			colors: {
				// ─── Backgrounds (layered, macOS-style) ────────────────────
				// canvas: the window's deepest fill (vibrancy peeks through on darwin)
				'bg.canvas': {
					value: { base: '{colors.gray.50}', _dark: '{colors.gray.950}' },
				},
				'bg.canvas.alt': {
					value: { base: '#FFFFFF', _dark: '{colors.gray.900}' },
				},
				// surface: panels, cards, the request editor body
				'bg.surface': {
					value: { base: '#FFFFFF', _dark: '{colors.gray.900}' },
				},
				'bg.surface.alt': {
					value: { base: '{colors.gray.50}', _dark: '{colors.gray.850}' },
				},
				'bg.surface.emphasized': {
					value: { base: '{colors.gray.100}', _dark: '{colors.gray.800}' },
				},
				'bg.subtle': {
					value: { base: '{colors.gray.50}', _dark: '{colors.gray.950}' },
				},

				// ─── Foregrounds (4 levels, macOS HIG) ─────────────────────
				'fg.default': {
					value: { base: '{colors.gray.950}', _dark: '{colors.gray.50}' },
				},
				'fg.muted': {
					value: { base: '{colors.gray.700}', _dark: '{colors.gray.300}' },
				},
				'fg.subtle': {
					value: { base: '{colors.gray.500}', _dark: '{colors.gray.400}' },
				},
				'fg.disabled': {
					value: { base: '{colors.gray.400}', _dark: '{colors.gray.600}' },
				},
				'fg.onAccent': {
					value: '#FFFFFF',
				},

				// ─── Borders / separators ──────────────────────────────────
				'border.subtle': {
					value: { base: '{colors.gray.200}', _dark: '{colors.gray.800}' },
				},
				'border.default': {
					value: { base: '{colors.gray.300}', _dark: '{colors.gray.700}' },
				},
				'border.emphasized': {
					value: { base: '{colors.gray.400}', _dark: '{colors.gray.600}' },
				},

				// ─── Brand / accent surfaces ────────────────────────────────
				// Solid accents map to the 500 step.
				'accent.pink': { value: '{colors.pink.500}' },
				'accent.teal': { value: '{colors.teal.500}' },
				'accent.indigo': { value: '{colors.indigo.600}' },
				'accent.alert': { value: '{colors.red.500}' },
				'accent.success': { value: '{colors.green.500}' },
				'accent.warning': { value: '{colors.yellow.500}' },
				'accent.info': { value: '{colors.blue.500}' },

				// Muted (low-contrast tinted fills for hover/highlight states).
				'accent.pink.muted': {
					value: { base: '{colors.pink.100}', _dark: '{colors.pink.950}' },
				},
				'accent.teal.muted': {
					value: { base: '{colors.teal.100}', _dark: '{colors.teal.950}' },
				},
				'accent.indigo.muted': {
					value: { base: '{colors.indigo.100}', _dark: '{colors.indigo.950}' },
				},
				'accent.alert.muted': {
					value: { base: '{colors.red.100}', _dark: '{colors.red.950}' },
				},
				'accent.success.muted': {
					value: { base: '{colors.green.100}', _dark: '{colors.green.950}' },
				},
				'accent.warning.muted': {
					value: { base: '{colors.yellow.100}', _dark: '{colors.yellow.950}' },
				},
				'accent.info.muted': {
					value: { base: '{colors.blue.100}', _dark: '{colors.blue.950}' },
				},
			},
		},
	},
	globalCss: {
		// Chakra v3 emits custom semantic tokens with their literal token name
		// (`'accent.pink' → --beak-colors-accent\.pink` with an escaped dot), but
		// virtually every call site in the renderer references them with dashes
		// (`var(--beak-colors-accent-pink)`). That dash form never resolved, so the
		// references silently fell back to `currentColor`. We publish dash-form
		// aliases here so existing code works without sweeping refactors.
		':where(html, .chakra-theme)': {
			'--beak-colors-accent-pink': 'var(--beak-colors-pink-500)',
			'--beak-colors-accent-teal': 'var(--beak-colors-teal-500)',
			'--beak-colors-accent-indigo': 'var(--beak-colors-indigo-600)',
			'--beak-colors-accent-alert': 'var(--beak-colors-red-500)',
			'--beak-colors-accent-success': 'var(--beak-colors-green-500)',
			'--beak-colors-accent-warning': 'var(--beak-colors-yellow-500)',
			'--beak-colors-accent-info': 'var(--beak-colors-blue-500)',
			'--beak-colors-fg-onAccent': 'var(--beak-colors-gray-50)',
			// Layered surface + foreground + border aliases. Same root cause as
			// the accent block — portal-mounted popups (variable picker, header
			// autocomplete, suggestion lists) use `var(--beak-colors-bg-surface)`
			// in raw CSS and the dotted Chakra emission never resolved as a dash
			// name, so they rendered transparent over whatever sat behind the
			// portal. Light defaults live on `:where(html)`; dark overrides ride
			// on `html.dark` below.
			'--beak-colors-bg-canvas': 'var(--beak-colors-gray-50)',
			'--beak-colors-bg-surface': '#FFFFFF',
			'--beak-colors-bg-surface-alt': 'var(--beak-colors-gray-50)',
			'--beak-colors-bg-surface-emphasized': 'var(--beak-colors-gray-100)',
			'--beak-colors-bg-subtle': 'var(--beak-colors-gray-50)',
			'--beak-colors-fg-default': 'var(--beak-colors-gray-950)',
			'--beak-colors-fg-muted': 'var(--beak-colors-gray-700)',
			'--beak-colors-fg-subtle': 'var(--beak-colors-gray-500)',
			'--beak-colors-fg-disabled': 'var(--beak-colors-gray-400)',
			'--beak-colors-border-subtle': 'var(--beak-colors-gray-200)',
			'--beak-colors-border-default': 'var(--beak-colors-gray-300)',
			'--beak-colors-border-emphasized': 'var(--beak-colors-gray-400)',
		},
		':where(html.dark)': {
			'--beak-colors-bg-canvas': 'var(--beak-colors-gray-950)',
			'--beak-colors-bg-surface': 'var(--beak-colors-gray-900)',
			'--beak-colors-bg-surface-alt': 'var(--beak-colors-gray-850)',
			'--beak-colors-bg-surface-emphasized': 'var(--beak-colors-gray-800)',
			'--beak-colors-bg-subtle': 'var(--beak-colors-gray-950)',
			'--beak-colors-fg-default': 'var(--beak-colors-gray-50)',
			'--beak-colors-fg-muted': 'var(--beak-colors-gray-300)',
			'--beak-colors-fg-subtle': 'var(--beak-colors-gray-400)',
			'--beak-colors-fg-disabled': 'var(--beak-colors-gray-600)',
			'--beak-colors-border-subtle': 'var(--beak-colors-gray-800)',
			'--beak-colors-border-default': 'var(--beak-colors-gray-700)',
			'--beak-colors-border-emphasized': 'var(--beak-colors-gray-600)',
		},
		'html, body': {
			margin: 0,
			padding: 0,
			overflow: 'hidden',
			color: 'fg.default',
			fontFamily: 'body',
			fontSize: 'md',
			lineHeight: 1.4,
			userSelect: 'none',
		},
		'input[type=text], input[type=number], select, input[type=email], article[contenteditable=true]': {
			'&:focus:not(:disabled)': {
				outline: '0',
				borderColor: 'accent.pink',
				boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
				background: 'bg.surface.alt',
				borderRadius: '4px',
			},
			'&:disabled': {
				cursor: 'text',
			},
		},
		// Tooltip styling lives next to the Tooltip registry in
		// `@beak/ui/components/molecules/Tooltips.tsx` (`.beak-tooltip` class,
		// injected at module load with `!important`). Keeping it there means
		// the styling lives next to the mount registry and we don't have to
		// scatter `!important` overrides across two files.
		'::selection': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
			color: 'var(--beak-colors-fg-default)',
		},
		'::-webkit-scrollbar': {
			width: '8px',
			height: '8px',
		},
		'::-webkit-scrollbar-track': {
			background: 'transparent',
		},
		'::-webkit-scrollbar-thumb': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-fg-muted) 22%, transparent)',
			borderRadius: '4px',
			border: '2px solid transparent',
			backgroundClip: 'padding-box',
			transition: 'background-color .12s ease',
			'&:hover': {
				backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)',
				backgroundClip: 'padding-box',
			},
		},
		'::-webkit-scrollbar-corner': {
			background: 'transparent',
		},
	},
});

export const system = createSystem(defaultConfig, config);
