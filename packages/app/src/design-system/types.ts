export type Theme = 'light' | 'dark';
export type Themes = Record<Theme, UIColors>;

export interface DesignSystem {
	theme: Theme;
	ui: UIColors;
	fonts: Fonts;
}

export interface UIColors {
	// Fill
	primaryFill: string;
	secondaryFill: string;
	tertiaryFill: string;
	surfaceFill: string;
	blankFill: string;
	alertFill: string;

	// Action
	goAction: string;
	goActionMuted: string;
	secondaryAction: string;
	secondaryActionMuted: string;
	destructiveAction: string;
	destructiveActionMuted: string;

	// Background
	background: string;
	secondaryBackground: string;
	blankBackground: string;

	// Surface
	surface: string;
	surfaceHighlight: string;
	secondarySurface: string;

	// Separator
	backgroundBorderSeparator: string;
	surfaceBorderSeparator: string;

	// Text
	textOnAction: string;
	textOnFill: string;
	textHighlight: string;
	textSuccess: string;
	textAlert: string;
	textOnSurfaceBackground: string;
	textOnSurfaceBackgroundMuted: string;
	textMinor: string;
	textMinorMuted: string;
}

export interface BorderRadius {
	none: string;
	tiny: string;
	extraSmall: string;
	small: string;
	regular: string;
	large: string;
	extraLarge: string;
}

export interface Spacing {
	extraSmall: string;
	small: string;
	regular: string;
	large: string;
	extraLarge: string;
}

export interface Fonts {
	default: string;
}

declare module 'styled-components' {
	interface DefaultTheme extends DesignSystem {}
}
