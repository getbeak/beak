import { Theme, UIColors } from './types';

const darkTheme: UIColors = {
	primaryFill: '#d45d80',
	secondaryFill: '#333399',
	tertiaryFill: '#33CC99',
	surfaceFill: '#2a2f43',
	blankFill: '#ffffff',
	alertFill: '#FC3233',

	goAction: '#33CC99',
	goActionMuted: 'rgba(51, 204, 153, 0.1)',
	secondaryAction: '#d45d80',
	secondaryActionMuted: 'rgba(212, 93, 128, 0.1)',
	destructiveAction: '#FC3233',
	destructiveActionMuted: '#DB182C',

	background: '#1A1E2D',
	secondaryBackground: '#181d25',
	blankBackground: '#1A1E2D',

	surface: '#161824',
	surfaceHighlight: '#131824',
	secondarySurface: '#242941',

	backgroundBorderSeparator: '#4a4651',
	surfaceBorderSeparator: '#1A1E2D',

	textOnAction: '#ffffff',
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
	surfaceFill: '#ffffff',
	blankFill: '#ffffff',
	alertFill: '#FC3233',

	goAction: '#33CC99',
	goActionMuted: 'rgba(51, 204, 153, 0.1)',
	secondaryAction: '#d45d80',
	secondaryActionMuted: 'rgba(212, 93, 128, 0.1)',
	destructiveAction: '#FC3233',
	destructiveActionMuted: '#DB182C',

	background: '#ffffff',
	secondaryBackground: '#ffffff',
	blankBackground: '#ffffff',

	surface: '#ffffff',
	surfaceHighlight: '#f3f3f3',
	secondarySurface: '#ececec',

	backgroundBorderSeparator: '#dadada',
	surfaceBorderSeparator: '#d7d7d7',

	textOnAction: '#ffffff',
	textOnFill: '#616161',
	textHighlight: '#d45d80',
	textSuccess: '#33CC99',
	textAlert: '#FC3233',
	textOnSurfaceBackground: '#2e2e2e',
	textOnSurfaceBackgroundMuted: '#4B5178',
	textMinor: '#616161',
	textMinorMuted: '#989899',
};

function createUiColors(theme: Theme): UIColors {
	return theme === 'dark' ? darkTheme : lightTheme;
}

export { createUiColors };
