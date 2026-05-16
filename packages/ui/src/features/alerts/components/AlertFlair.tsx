import { selectAllAlerts, selectMaxSeverity } from '@beak/ui/store/project/selectors/alerts';
import type { Alert, AlertSeverity } from '@beak/ui/store/project/types';
import { useAppSelector } from '@beak/ui/store/redux';
import { Flex } from '@chakra-ui/react';
import * as React from 'react';
import { useMemo } from 'react';

import { openAlertsPanel } from '../lib/panel-state';
import { SEVERITY_PRESETS } from '../lib/severity';

interface AlertFlairProps {
	/** Match alerts whose scope is `{ kind: 'request', requestId }`. */
	requestId?: string;
	/** Match alerts whose scope is `{ kind: 'endpoint', folderPath }`. */
	endpointFolderPath?: string;
	/** Optional rendering size — tabs use 14px, sidebar rows use 12px. */
	size?: number;
	/** When true, clicking the dot opens the Problems panel filtered. */
	interactive?: boolean;
}

/**
 * Tiny scope-scoped flair surfaced on sidebar rows, tab strips, and inline
 * banner headers. Reads alerts matching the scope, picks the highest
 * severity present, and renders the canonical icon/pill so a row with two
 * warnings + one error reads as red.
 *
 * Returns null when nothing matches — callers wrap it next to other flair
 * (the linked-spec dot, flight status) and trust this component to keep
 * itself out of the way until something needs attention.
 */
const AlertFlair: React.FC<AlertFlairProps> = ({ requestId, endpointFolderPath, size = 14, interactive }) => {
	const alerts = useAppSelector(selectAllAlerts);
	const matched = useMemo<Alert[]>(() => {
		if (requestId) {
			return alerts.filter(a => a.scope.kind === 'request' && a.scope.requestId === requestId);
		}
		if (endpointFolderPath) {
			return alerts.filter(a => a.scope.kind === 'endpoint' && a.scope.folderPath === endpointFolderPath);
		}
		return [];
	}, [alerts, requestId, endpointFolderPath]);

	const severity: AlertSeverity | null = matched.length ? selectMaxSeverity(matched) : null;
	if (!severity) return null;

	const preset = SEVERITY_PRESETS[severity];
	const Icon = preset.icon;
	const accent = preset.accentVar;
	const count = matched.length;
	const titleText = `${count} ${count === 1 ? preset.label.toLowerCase() : preset.pluralLabel.toLowerCase()} on this ${requestId ? 'request' : 'endpoint'}`;

	return (
		<Flex
			as='span'
			role={interactive ? 'button' : undefined}
			tabIndex={interactive ? 0 : undefined}
			align='center'
			justify='center'
			w={`${size}px`}
			h={`${size}px`}
			borderRadius='sm'
			color={accent}
			bg={`color-mix(in srgb, ${accent} 14%, transparent)`}
			borderWidth='1px'
			borderColor={`color-mix(in srgb, ${accent} 28%, transparent)`}
			cursor={interactive ? 'pointer' : 'default'}
			title={titleText}
			aria-label={titleText}
			onClick={
				interactive
					? e => {
							e.stopPropagation();
							openAlertsPanel(severity);
						}
					: undefined
			}
			onKeyDown={
				interactive
					? e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								e.stopPropagation();
								openAlertsPanel(severity);
							}
						}
					: undefined
			}
		>
			<Icon size={Math.max(8, size - 6)} strokeWidth={2.4} />
		</Flex>
	);
};

export default AlertFlair;
