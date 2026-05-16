import type { AlertSeverity } from '@beak/ui/store/project/types';
import { Flex } from '@chakra-ui/react';
import * as React from 'react';

import { SEVERITY_PRESETS } from '../../lib/severity';

interface SeverityIconProps {
	severity: AlertSeverity;
	size?: number;
	/** When 'soft', renders a tinted background pill behind the glyph. */
	variant?: 'soft' | 'plain';
}

/**
 * Render the canonical icon for a severity inside a tinted pill. Shared by
 * the status-strip badges, panel rows, and inline banner so the visual
 * language stays consistent — change a colour in `severity.ts` and every
 * surface follows.
 */
const SeverityIcon: React.FC<SeverityIconProps> = ({ severity, size = 12, variant = 'soft' }) => {
	const preset = SEVERITY_PRESETS[severity];
	const Icon = preset.icon;
	const accent = preset.accentVar;

	if (variant === 'plain') {
		return <Icon size={size} strokeWidth={2.2} color={accent} aria-hidden />;
	}

	const pillSize = Math.max(size + 12, 22);

	return (
		<Flex
			align='center'
			justify='center'
			w={`${pillSize}px`}
			h={`${pillSize}px`}
			flexShrink={0}
			borderRadius='md'
			color={accent}
			bg={`color-mix(in srgb, ${accent} 14%, transparent)`}
			borderWidth='1px'
			borderColor={`color-mix(in srgb, ${accent} 28%, transparent)`}
			boxShadow={`0 3px 8px color-mix(in srgb, ${accent} 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)`}
			aria-hidden
		>
			<Icon size={size} strokeWidth={2.2} />
		</Flex>
	);
};

export default SeverityIcon;
