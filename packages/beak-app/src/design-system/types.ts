export type Theme = 'light' | 'dark';
export type Themes = Record<Theme, UIColors>;

export interface DesignSystem {
	ui: UIColors;
	brand: BrandColors;
	fonts: Fonts;
}

export interface BrandColors {
	primary: string;
	primaryFaded: string;
	primaryVariant: string;
	primaryMuted1: string;
	primaryMuted2: string;
	primaryMuted3: string;
	primaryMuted4: string;
	primaryMuted5: string;

	secondary: string;
	secondaryFaded: string;
	secondaryVariant: string;
	secondaryMuted1: string;

	tertiary: string;
	tertiaryFaded: string;
	tertiaryVariant: string;
	tertiaryMuted1: string;
	tertiaryMuted2: string;

	accent: string;
	accentVariant1: string;
	accentVariant2: string;
	accentVariant3: string;
	accentMuted1: string;
	accentMuted2: string;
	accentMuted3: string;
	accentMuted4: string;

	alert: string;
	alertVariant: string;
	alertMuted1: string;

	grey: string;
	greyVariant: string;
	greyMuted1: string;
	greyMuted2: string;

	blank: string;

	shade: string;
	shadeVariant: string;
	shade1: string;
	shade2: string;
	shade3: string;
	shade4: string;
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
