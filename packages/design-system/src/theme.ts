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
 *   gray   — neutral, slightly cool (macOS-leaning)
 *   blue   — system blue (informational)
 *   pink   — Beak brand pink (primary)
 *   teal   — Beak brand teal (success / GET)
 *   indigo — Beak brand indigo (focus / PUT-PATCH)
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
		'50': { value: '#F7F8FA' },
		'100': { value: '#EFF1F4' },
		'200': { value: '#E2E5EA' },
		'300': { value: '#C9CED7' },
		'400': { value: '#9AA1AD' },
		'500': { value: '#6B7280' },
		'600': { value: '#4A5160' },
		'700': { value: '#363B49' },
		'800': { value: '#242838' },
		'850': { value: '#1B1F2C' },
		'900': { value: '#141824' },
		'950': { value: '#0B0E18' },
	},
	pink: {
		'50': { value: '#FDF2F5' },
		'100': { value: '#FCE4EC' },
		'200': { value: '#F8C5D2' },
		'300': { value: '#F19DB0' },
		'400': { value: '#E58399' },
		'500': { value: '#D45D80' },
		'600': { value: '#B84A6C' },
		'700': { value: '#963A56' },
		'800': { value: '#6E2A40' },
		'900': { value: '#4A1B2A' },
		'950': { value: '#2A0F19' },
	},
	teal: {
		'50': { value: '#ECFDF6' },
		'100': { value: '#D2F9E5' },
		'200': { value: '#A5F0CC' },
		'300': { value: '#6FE3B0' },
		'400': { value: '#45D9A5' },
		'500': { value: '#33CC99' },
		'600': { value: '#29A37B' },
		'700': { value: '#1F7A5C' },
		'800': { value: '#155339' },
		'900': { value: '#0C351F' },
		'950': { value: '#061D11' },
	},
	indigo: {
		'50': { value: '#EEEEFD' },
		'100': { value: '#D8D8F9' },
		'200': { value: '#B2B2F2' },
		'300': { value: '#8585E5' },
		'400': { value: '#5C5CC8' },
		'500': { value: '#4646B0' },
		'600': { value: '#333399' },
		'700': { value: '#2A2A7D' },
		'800': { value: '#20205F' },
		'900': { value: '#181847' },
		'950': { value: '#0E0E2A' },
	},
	red: {
		'50': { value: '#FEF2F2' },
		'100': { value: '#FFE0E0' },
		'200': { value: '#FFB8B8' },
		'300': { value: '#FF8585' },
		'400': { value: '#FF5757' },
		'500': { value: '#FC3233' },
		'600': { value: '#DB1F20' },
		'700': { value: '#B61617' },
		'800': { value: '#851011' },
		'900': { value: '#520808' },
		'950': { value: '#2C0404' },
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
					value: '-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
				},
				heading: {
					value: '-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
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
		'body .react-tooltip': {
			padding: '6px 8px',
			fontSize: '13px',
			boxShadow: '0 8px 24px rgba(0, 0, 0, 0.27)',
			zIndex: 105,
		},
		'::-webkit-scrollbar': {
			width: '6px',
			height: '6px',
		},
		'::-webkit-scrollbar-track': {
			background: 'transparent',
		},
		'::-webkit-scrollbar-thumb': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-gray-500) 30%, transparent)',
			transition: 'background .1s ease',
			'&:hover': {
				backgroundColor: 'var(--beak-colors-accent-pink)',
			},
		},
		'::-webkit-scrollbar-corner': {
			background: 'transparent',
		},
	},
});

export const system = createSystem(defaultConfig, config);
