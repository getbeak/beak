import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const tokenColor = (light: string, dark: string) => ({ value: { _light: light, _dark: dark } });

const config = defineConfig({
	globalCss: {
		'html, body': {
			margin: 0,
			padding: 0,
			fontFamily: '"Open Sans", sans-serif',
			background: '{colors.secondaryBackground}',
			color: '{colors.textOnSurfaceBackground}',
		},
		'*': {
			transition: 'background-color 250ms ease',
		},
		a: {
			color: '#ffa210',
		},
	},
	theme: {
		tokens: {
			fonts: {
				body: { value: '"Open Sans", sans-serif' },
				heading: { value: '"Open Sans", sans-serif' },
			},
		},
		semanticTokens: {
			colors: {
				primaryFill: tokenColor('#d45d80', '#d45d80'),
				secondaryFill: tokenColor('#333399', '#333399'),
				tertiaryFill: tokenColor('#33CC99', '#33CC99'),
				surfaceFill: tokenColor('#ffffff', '#2a2f43'),
				blankFill: tokenColor('#ffffff', '#ffffff'),
				alertFill: tokenColor('#FC3233', '#FC3233'),

				goAction: tokenColor('#33CC99', '#33CC99'),
				goActionMuted: tokenColor('rgba(51, 204, 153, 0.1)', 'rgba(51, 204, 153, 0.1)'),
				secondaryAction: tokenColor('#d45d80', '#d45d80'),
				secondaryActionMuted: tokenColor('rgba(212, 93, 128, 0.1)', 'rgba(212, 93, 128, 0.1)'),
				destructiveAction: tokenColor('#FC3233', '#FC3233'),
				destructiveActionMuted: tokenColor('#DB182C', '#DB182C'),

				background: tokenColor('#ffffff', '#1A1E2D'),
				secondaryBackground: tokenColor('#ffffff', '#181d25'),
				blankBackground: tokenColor('#ffffff', '#1A1E2D'),

				surface: tokenColor('#ffffff', '#161824'),
				surfaceHighlight: tokenColor('#f3f3f3', '#131824'),
				secondarySurface: tokenColor('#ececec', '#242941'),

				backgroundBorderSeparator: tokenColor('#dadada', '#4a4651'),
				surfaceBorderSeparator: tokenColor('#d7d7d7', '#1A1E2D'),

				textOnAction: tokenColor('#ffffff', '#ffffff'),
				textOnFill: tokenColor('#616161', '#a6accd'),
				textHighlight: tokenColor('#d45d80', '#d45d80'),
				textSuccess: tokenColor('#33CC99', '#33CC99'),
				textAlert: tokenColor('#FC3233', '#FC3233'),
				textOnSurfaceBackground: tokenColor('#2e2e2e', '#ffffff'),
				textOnSurfaceBackgroundMuted: tokenColor('#4B5178', '#4B5178'),
				textMinor: tokenColor('#616161', '#BEBEC6'),
				textMinorMuted: tokenColor('#989899', '#a6accd'),
			},
		},
	},
});

export const system = createSystem(defaultConfig, config);
