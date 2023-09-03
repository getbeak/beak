import { instance as windowSessionInstance } from '@beak/ui/contexts/window-session-context';
import { toHexAlpha } from '@beak/design-system/utils';

export function toVibrancyAlpha(color: string, opacity: number) {
	// We always want full transparency on darwin platforms
	if (windowSessionInstance.isDarwin())
		return toHexAlpha(color, 0);

	return toHexAlpha(color, opacity, !windowSessionInstance.isBrowser());
}
