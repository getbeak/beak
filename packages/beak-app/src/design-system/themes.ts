import { TypedObject } from '../helpers/typescript';
import { BrandColors, Theme, UIColors } from './types';

type UIColorsBrandMapping =
	Record<keyof UIColors, keyof BrandColors> &
	Partial<Record<'modifiers', Partial<Record<keyof UIColors, Modifiers>>>>;

export type Modifiers = OpacityModifier;

export interface OpacityModifier {
	type: 'opacity';
	value: number;
}

const darkThemeMapping: UIColorsBrandMapping = {
	primaryFill: 'primary',
	secondaryFill: 'secondary',
	tertiaryFill: 'tertiary',
	surfaceFill: 'shadeVariant',
	blankFill: 'blank',
	alertFill: 'alert',

	goAction: 'tertiary',
	goActionMuted: 'tertiaryFaded',
	secondaryAction: 'primary',
	secondaryActionMuted: 'primaryFaded',
	destructiveAction: 'alert',
	destructiveActionMuted: 'alertMuted1',

	background: 'shadeVariant',
	secondaryBackground: 'shade1',
	blankBackground: 'shadeVariant',

	surface: 'shade3',
	surfaceHighlight: 'shade',
	secondarySurface: 'shade2',

	backgroundBorderSeparator: 'shade',
	surfaceBorderSeparator: 'shadeVariant',

	textOnAction: 'blank',
	textOnFill: 'grey',
	textHighlight: 'primary',
	textSuccess: 'tertiary',
	textAlert: 'alert',
	textOnSurfaceBackground: 'blank',
	textOnSurfaceBackgroundMuted: 'shade4',
	textMinor: 'greyMuted1',
	textMinorMuted: 'grey',
};

function createUiColors(brand: BrandColors, theme: Theme): UIColors {
	if (theme === 'light')
		throw new Error('not implemented yet');

	const mapping = darkThemeMapping;
	const colors = TypedObject.keys(mapping).filter(k => k !== 'modifiers')
		.reduce((acc, key) => {
			const value = mapping[key] as keyof BrandColors;

			return {
				...acc,
				[key]: brand[value],
			};
		}, {}) as UIColors;

	return colors;
}

export { createUiColors };
