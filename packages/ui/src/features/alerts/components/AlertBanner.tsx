import { selectAllAlerts, selectMaxSeverity } from '@beak/ui/store/project/selectors/alerts';
import type { Alert, AlertSeverity } from '@beak/ui/store/project/types';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';

import { openAlertsPanel } from '../lib/panel-state';
import { SEVERITY_PRESETS } from '../lib/severity';

interface AlertBannerProps {
	requestId: string;
}

/**
 * Compact in-context banner shown above the request editor when the open
 * request has any alerts. Collapsed by default to a single colour-coded
 * line ("3 problems — click to expand"); expanding reveals each alert
 * inline with the same content the Problems panel shows.
 *
 * The point of this surface vs. the bottom status strip: when the user is
 * looking at request X, they should see X's problems *here*, not have to
 * trip down to a counter. The strip is the ambient/global signal; this is
 * the local one.
 */
const AlertBanner: React.FC<AlertBannerProps> = ({ requestId }) => {
	const all = useAppSelector(selectAllAlerts);
	const [expanded, setExpanded] = useState(false);

	const scoped = useMemo<Alert[]>(
		() => all.filter(a => a.scope.kind === 'request' && a.scope.requestId === requestId),
		[all, requestId],
	);

	if (scoped.length === 0) return null;

	const maxSeverity: AlertSeverity = selectMaxSeverity(scoped) ?? 'notice';
	const preset = SEVERITY_PRESETS[maxSeverity];
	const Icon = preset.icon;
	const accent = preset.accentVar;
	const firstAlert = scoped[0];
	const summary = scoped.length === 1 && firstAlert
		? singleAlertSummary(firstAlert)
		: `${scoped.length} problems on this request`;

	return (
		<Box
			borderBottomWidth='1px'
			borderColor='border.subtle'
			bg={`color-mix(in srgb, ${accent} 8%, var(--beak-colors-bg-surface))`}
		>
			<Flex
				role='button'
				tabIndex={0}
				as='div'
				align='center'
				gap='2'
				px='3'
				py='1.5'
				cursor='pointer'
				_hover={{ bg: `color-mix(in srgb, ${accent} 14%, var(--beak-colors-bg-surface))` }}
				onClick={() => setExpanded(v => !v)}
				onKeyDown={e => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						setExpanded(v => !v);
					}
				}}
				aria-expanded={expanded}
				aria-label={summary}
			>
				<Flex
					align='center'
					justify='center'
					w='18px'
					h='18px'
					borderRadius='sm'
					color={accent}
					bg={`color-mix(in srgb, ${accent} 18%, transparent)`}
					borderWidth='1px'
					borderColor={`color-mix(in srgb, ${accent} 36%, transparent)`}
				>
					<Icon size={11} strokeWidth={2.4} />
				</Flex>
				<Box fontSize='xs' fontWeight='600' color='fg.default' flex='1 1 auto'>
					{summary}
				</Box>
				<Flex
					role='button'
					tabIndex={0}
					as='div'
					align='center'
					h='18px'
					px='1.5'
					borderRadius='sm'
					fontSize='10px'
					color='fg.muted'
					letterSpacing='0.02em'
					textTransform='uppercase'
					_hover={{ color: 'fg.default', bg: 'bg.subtle' }}
					onClick={e => {
						e.stopPropagation();
						openAlertsPanel(null);
					}}
					onKeyDown={e => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							e.stopPropagation();
							openAlertsPanel(null);
						}
					}}
				>
					{'View all'}
				</Flex>
				{expanded ? (
					<ChevronDown size={12} color='var(--beak-colors-fg-muted)' aria-hidden />
				) : (
					<ChevronRight size={12} color='var(--beak-colors-fg-muted)' aria-hidden />
				)}
			</Flex>
			{expanded && (
				<Box px='3' py='2' borderTopWidth='1px' borderColor='border.subtle' bg='bg.surface'>
					{scoped.map((alert, idx) => (
						<BannerAlertLine key={idx} alert={alert} />
					))}
				</Box>
			)}
		</Box>
	);
};

const BannerAlertLine: React.FC<{ alert: Alert }> = ({ alert }) => {
	const preset = SEVERITY_PRESETS[alert.severity];
	const Icon = preset.icon;
	const accent = preset.accentVar;
	const content = describeAlert(alert);
	return (
		<Flex align='flex-start' gap='2' py='1'>
			<Icon size={11} strokeWidth={2.2} color={accent} aria-hidden style={{ marginTop: 3, flexShrink: 0 }} />
			<Box flex='1 1 auto'>
				<Box fontSize='xs' fontWeight='600' color='fg.default' lineHeight='1.35'>
					{content.title}
				</Box>
				<Box fontSize='11px' color='fg.muted' lineHeight='1.45' mt='0.5'>
					{content.description}
				</Box>
			</Box>
		</Flex>
	);
};

function singleAlertSummary(alert: Alert): string {
	switch (alert.type) {
		case 'http_body_not_allowed':
			return 'This verb doesn’t allow a body';
		case 'flight_failed':
			return 'Last flight failed';
		case 'endpoint_sync_failed':
			return `Sync failed — ${alert.payload.folderName}`;
		case 'invalid_extension':
			return `Extension “${alert.payload.assumedName}” failed to load`;
		case 'missing_encryption':
			return 'Project encryption key missing';
	}
}

function describeAlert(alert: Alert): { title: string; description: string } {
	switch (alert.type) {
		case 'http_body_not_allowed':
			return {
				title: 'HTTP verb doesn’t allow a body',
				description: 'GET, HEAD, and OPTIONS requests can’t include a body. Switch verb or clear the body to send.',
			};
		case 'missing_encryption':
			return {
				title: 'Project encryption key is missing',
				description: 'Some secrets in this project can’t be decrypted until the key is restored.',
			};
		case 'invalid_extension':
			return {
				title: `Extension “${alert.payload.assumedName}” failed to load`,
				description: 'Open the Problems panel to view the error log.',
			};
		case 'endpoint_sync_failed':
			return {
				title: `Sync failed — ${alert.payload.folderName}`,
				description: alert.payload.errorMessage,
			};
		case 'flight_failed':
			return {
				title: 'Last flight failed',
				description: alert.payload.errorMessage,
			};
	}
}

export default AlertBanner;
