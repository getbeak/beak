export function toHexAlpha(color: string, opacity: number, ignoreAlpha?: boolean) {
	if (ignoreAlpha)
		return color;

	const hexOpacity = Math.ceil(opacity * 255).toString(16);

	return `${color}${hexOpacity}`;
}
