import { isDarwin } from "../globals";

export function toHexAlpha(color: string, opacity: number, ignoreAlpha?: boolean) {
	if (ignoreAlpha)
		return color;

	const hexOpacity = Math.ceil(opacity * 255).toString(16);

	return `${color}${hexOpacity}`;
}

export function toVibrancyAlpha(color: string, opacity: number) {
	return toHexAlpha(color, opacity, !isDarwin());
}
