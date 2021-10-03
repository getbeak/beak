import { Theme, UIColors } from './types';

const darkTheme: UIColors = {
	primaryFill: '#d45d80',
	secondaryFill: '#333399',
	tertiaryFill: '#33CC99',
	surfaceFill: '#1A1E2D',
	blankFill: '#fff',
	alertFill: '#FC3233',

	goAction: '#33CC99',
	goActionMuted: 'rgba(51, 204, 153, 0.1)',
	secondaryAction: '#d45d80',
	secondaryActionMuted: 'rgba(212, 93, 128, 0.1)',
	destructiveAction: '#FC3233',
	destructiveActionMuted: '#DB182C',

	background: '#1A1E2D',
	secondaryBackground: '#161824',
	blankBackground: '#1A1E2D',

	surface: '#181d25',
	surfaceHighlight: '#1b1e2b',
	secondarySurface: '#242941',

	backgroundBorderSeparator: '#4a4651',
	surfaceBorderSeparator: '#1A1E2D',

	textOnAction: '#fff',
	textOnFill: '#a6accd',
	textHighlight: '#d45d80',
	textSuccess: '#33CC99',
	textAlert: '#FC3233',
	textOnSurfaceBackground: '#fff',
	textOnSurfaceBackgroundMuted: '#4B5178',
	textMinor: '#BEBEC6',
	textMinorMuted: '#a6accd',
};

const lightTheme: UIColors = {
	primaryFill: '#d45d80',
	secondaryFill: '#333399',
	tertiaryFill: '#33CC99',
	surfaceFill: '#1A1E2D',
	blankFill: '#fff',
	alertFill: '#FC3233',

	goAction: '#33CC99',
	goActionMuted: 'rgba(51, 204, 153, 0.1)',
	secondaryAction: '#d45d80',
	secondaryActionMuted: 'rgba(212, 93, 128, 0.1)',
	destructiveAction: '#FC3233',
	destructiveActionMuted: '#DB182C',

	background: '#F7F7FF',
	secondaryBackground: '#fff',
	blankBackground: '#fff',

	surface: '#fff',
	surfaceHighlight: '#1b1e2b',
	secondarySurface: '#3A3F55',

	backgroundBorderSeparator: '#4a4651',
	surfaceBorderSeparator: '#1A1E2D',

	textOnAction: '#fff',
	textOnFill: '#a6accd',
	textHighlight: '#d45d80',
	textSuccess: '#33CC99',
	textAlert: '#FC3233',
	textOnSurfaceBackground: '#fff',
	textOnSurfaceBackgroundMuted: '#4B5178',
	textMinor: '#BEBEC6',
	textMinorMuted: '#a6accd',
};

function createUiColors(theme: Theme): UIColors {
	return theme === 'dark' ? darkTheme : lightTheme;
}

export { createUiColors };
