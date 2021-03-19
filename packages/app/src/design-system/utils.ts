import { toHexAlpha } from '@beak/design-system/utils';

import { isDarwin } from '../globals';

export function toVibrancyAlpha(color: string, opacity: number) {
	return toHexAlpha(color, opacity, !isDarwin());
}
