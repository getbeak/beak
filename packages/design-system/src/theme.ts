import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * Beak's Chakra v3 design tokens.
 *
 * Brand colours are preserved verbatim from the previous styled-components
 * theme (the pink/teal/indigo triad) so the migration is visually consistent.
 * The spacing scale is compressed compared to Chakra's defaults — Beak is a
 * desktop tool and benefits from denser layout than the mobile-first defaults.
 *
 * Semantic tokens (`bg.canvas`, `fg.default`, etc.) carry the light/dark
 * resolution so feature components can read them without conditionals.
 */
const config = defineConfig({
	cssVarsPrefix: 'beak',
	theme: {
		tokens: {
			colors: {
				brand: {
					pink: { value: '#d45d80' },
					teal: { value: '#33CC99' },
					indigo: { value: '#333399' },
					alert: { value: '#FC3233' },
					success: { value: '#33CC99' },
				},
			},
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
			// Compact spacing scale. Chakra defaults are mobile-friendly (4px
			// base unit, large jumps); we shift to a denser scale so the
			// desktop UI doesn't feel padded.
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
			},
		},
		semanticTokens: {
			colors: {
				// Canvas (window background, vibrancy-aware on macOS via global css)
				'bg.canvas': {
					value: { base: '#ffffff', _dark: '#1A1E2D' },
				},
				'bg.canvas.alt': {
					value: { base: '#ffffff', _dark: '#181d25' },
				},
				// Surface (panels, cards, request editor)
				'bg.surface': {
					value: { base: '#ffffff', _dark: '#161824' },
				},
				'bg.surface.alt': {
					value: { base: '#f3f3f3', _dark: '#131824' },
				},
				'bg.surface.emphasized': {
					value: { base: '#ececec', _dark: '#242941' },
				},
				// Inputs / chrome
				'bg.subtle': {
					value: { base: '#fafafa', _dark: '#1f2333' },
				},
				// Foregrounds
				'fg.default': {
					value: { base: '#2e2e2e', _dark: '#ffffff' },
				},
				'fg.muted': {
					value: { base: '#616161', _dark: '#BEBEC6' },
				},
				'fg.subtle': {
					value: { base: '#989899', _dark: '#a6accd' },
				},
				'fg.disabled': {
					value: { base: '#bdbdbd', _dark: '#4B5178' },
				},
				'fg.onAccent': {
					value: '#ffffff',
				},
				// Borders
				'border.default': {
					value: { base: '#dadada', _dark: '#4a4651' },
				},
				'border.subtle': {
					value: { base: '#e7e7e7', _dark: '#1A1E2D' },
				},
				'border.emphasized': {
					value: { base: '#c8c8c8', _dark: '#5b5e74' },
				},
				// Brand surfaces
				'accent.pink': {
					value: '{colors.brand.pink}',
				},
				'accent.pink.muted': {
					value: { base: 'rgba(212, 93, 128, 0.12)', _dark: 'rgba(212, 93, 128, 0.18)' },
				},
				'accent.teal': {
					value: '{colors.brand.teal}',
				},
				'accent.teal.muted': {
					value: { base: 'rgba(51, 204, 153, 0.12)', _dark: 'rgba(51, 204, 153, 0.18)' },
				},
				'accent.indigo': {
					value: '{colors.brand.indigo}',
				},
				'accent.alert': {
					value: '{colors.brand.alert}',
				},
				'accent.alert.muted': {
					value: { base: 'rgba(252, 50, 51, 0.10)', _dark: 'rgba(252, 50, 51, 0.18)' },
				},
				'accent.success': {
					value: '{colors.brand.success}',
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
				boxShadow: '0 0 0 3px rgba(212, 93, 128, 0.47)',
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
			backgroundColor: 'rgba(212, 93, 128, 0.10)',
			transition: 'background .1s ease',
			'&:hover': {
				backgroundColor: 'accent.pink',
			},
		},
		'::-webkit-scrollbar-corner': {
			background: 'transparent',
		},
	},
});

export const system = createSystem(defaultConfig, config);
