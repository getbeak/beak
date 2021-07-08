import { instance as windowSessionInstance } from '@beak/app/contexts/window-session-context';
import { toHexAlpha } from '@beak/design-system/utils';

export function toVibrancyAlpha(color: string, opacity: number) {
	return toHexAlpha(color, opacity, !windowSessionInstance.isDarwin());
}
