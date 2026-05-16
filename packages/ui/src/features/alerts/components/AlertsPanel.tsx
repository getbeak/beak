import Button from '@beak/ui/components/atoms/Button';
import Popover, { PopoverBody, PopoverHeader } from '@beak/ui/components/molecules/Popover';
import FixProjectEncryption from '@beak/ui/features/encryption/components/FixProjectEncryption';
import ViewExtensionError from '@beak/ui/features/extension/components/ViewExtensionError';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { alertRemoveType } from '@beak/ui/store/project/actions';
import { selectAllAlerts } from '@beak/ui/store/project/selectors/alerts';
import type { Alert, AlertScope, AlertSeverity } from '@beak/ui/store/project/types';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { CheckCircle2 } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { closeAlertsPanel, useAlertsPanelState } from '../lib/panel-state';
import { SEVERITY_PRESETS } from '../lib/severity';
import SeverityIcon from './atoms/SeverityIcon';

interface AlertsPanelProps {
	anchor: HTMLElement | null;
}

interface PanelEntry {
	ident: string;
	alert: Alert;
}

interface PanelGroup {
	key: string;
	label: string;
	scope: AlertScope;
	entries: PanelEntry[];
}

const SEVERITY_ORDER: AlertSeverity[] = ['error', 'warning', 'notice'];

/**
 * Renders the full list of project alerts as an anchored panel above the
 * status strip. Groups by scope (project vs each request vs each endpoint
 * folder) so the user can see "request X has 2 problems" at a glance, and
 * honours the optional severity filter set by the strip pill that opened
 * it. Each entry routes to the existing fixer modal (encryption, extension
 * error) or jumps to the affected tab.
 */
const AlertsPanel: React.FC<AlertsPanelProps> = ({ anchor }) => {
	const panelState = useAlertsPanelState();
	const alertsMap = useAppSelector(state => state.global.project.alerts);
	const allAlerts = useAppSelector(selectAllAlerts);
	const tree = useAppSelector(s => s.global.project.tree);

	const filtered = useMemo(() => {
		if (!panelState.filterSeverity) return allAlerts;
		return allAlerts.filter(a => a.severity === panelState.filterSeverity);
	}, [allAlerts, panelState.filterSeverity]);

	const entries = useMemo<PanelEntry[]>(() => {
		const ents: PanelEntry[] = [];
		for (const ident in alertsMap) {
			const alert = alertsMap[ident];
			if (!alert) continue;
			if (panelState.filterSeverity && alert.severity !== panelState.filterSeverity) continue;
			ents.push({ ident, alert });
		}
		return ents;
	}, [alertsMap, panelState.filterSeverity]);

	const groups = useMemo<PanelGroup[]>(() => {
		const byKey = new Map<string, PanelGroup>();
		for (const entry of entries) {
			const { scope } = entry.alert;
			let key: string;
			let label: string;
			if (scope.kind === 'project') {
				key = 'project';
				label = 'Project';
			} else if (scope.kind === 'request') {
				key = `request:${scope.requestId}`;
				const node = tree[scope.requestId];
				const name = node && node.type === 'request' && node.mode === 'valid' ? node.name : 'Request';
				label = name;
			} else {
				key = `endpoint:${scope.folderPath}`;
				label = scope.folderPath;
			}
			const existing = byKey.get(key);
			if (existing) existing.entries.push(entry);
			else byKey.set(key, { key, label, scope, entries: [entry] });
		}
		// Sort: project first, then everything else alphabetically by label.
		const out = Array.from(byKey.values());
		out.sort((a, b) => {
			if (a.scope.kind === 'project') return -1;
			if (b.scope.kind === 'project') return 1;
			return a.label.localeCompare(b.label);
		});
		// Within each group, sort by severity descending then by ident for stability.
		for (const g of out) {
			g.entries.sort((a, b) => {
				const rankA = severityIndex(a.alert.severity);
				const rankB = severityIndex(b.alert.severity);
				if (rankA !== rankB) return rankA - rankB;
				return a.ident.localeCompare(b.ident);
			});
		}
		return out;
	}, [entries, tree]);

	const hasAlerts = filtered.length > 0;
	const headerTone: 'pink' | 'teal' = hasAlerts ? 'pink' : 'teal';

	if (!panelState.open || !anchor) return null;

	const headerCounts = SEVERITY_ORDER.map(sev => {
		const count = filtered.filter(a => a.severity === sev).length;
		if (count === 0) return null;
		return { severity: sev, count };
	}).filter(Boolean) as { severity: AlertSeverity; count: number }[];

	const filterLabel = panelState.filterSeverity ? SEVERITY_PRESETS[panelState.filterSeverity].pluralLabel : null;

	return (
		<Popover
			anchor={anchor}
			onClose={closeAlertsPanel}
			width={420}
			placement='top'
			align='start'
			ariaLabel='Project problems panel'
			tone={headerTone}
		>
			<PopoverHeader title={filterLabel ?? 'Problems'} showAccentDot={hasAlerts} />
			{headerCounts.length > 0 && (
				<Flex align='center' gap='1.5' px='3' py='1.5' borderBottomWidth='1px' borderColor='border.subtle' bg='bg.surface'>
					{headerCounts.map(c => (
						<HeaderCountChip key={c.severity} severity={c.severity} count={c.count} />
					))}
				</Flex>
			)}
			<PopoverBody padding={hasAlerts ? '0' : '12px'}>
				{!hasAlerts && <EmptyState filtered={Boolean(filterLabel)} />}
				{hasAlerts && (
					<Box maxH='60vh' overflowY='auto'>
						{groups.map(g => (
							<PanelGroupView key={g.key} group={g} />
						))}
					</Box>
				)}
			</PopoverBody>
		</Popover>
	);
};

function severityIndex(s: AlertSeverity): number {
	switch (s) {
		case 'error':
			return 0;
		case 'warning':
			return 1;
		case 'notice':
			return 2;
	}
}

const HeaderCountChip: React.FC<{ severity: AlertSeverity; count: number }> = ({ severity, count }) => {
	const preset = SEVERITY_PRESETS[severity];
	return (
		<Flex
			align='center'
			gap='1'
			h='18px'
			px='1.5'
			borderRadius='sm'
			fontSize='10px'
			fontWeight='600'
			color={preset.accentVar}
			bg={`color-mix(in srgb, ${preset.accentVar} 14%, transparent)`}
			borderWidth='1px'
			borderColor={`color-mix(in srgb, ${preset.accentVar} 28%, transparent)`}
		>
			<Box style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</Box>
			<Box opacity={0.8}>{count === 1 ? preset.label : preset.pluralLabel}</Box>
		</Flex>
	);
};

const PanelGroupView: React.FC<{ group: PanelGroup }> = ({ group }) => (
	<Box>
		<Box
			px='3'
			py='1.5'
			fontSize='10px'
			fontWeight='700'
			color='fg.muted'
			textTransform='uppercase'
			letterSpacing='0.04em'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			bg='bg.subtle'
			position='sticky'
			top='0'
			zIndex={1}
		>
			{group.label}
		</Box>
		{group.entries.map(e => (
			<AlertRow key={e.ident} entry={e} />
		))}
	</Box>
);

const EmptyState: React.FC<{ filtered: boolean }> = ({ filtered }) => (
	<Flex direction='column' align='center' gap='2' py='5' px='3' textAlign='center'>
		<Flex
			align='center'
			justify='center'
			w='34px'
			h='34px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
			color='accent.teal'
		>
			<CheckCircle2 size={16} strokeWidth={2.2} />
		</Flex>
		<Box fontSize='sm' fontWeight='600' color='fg.default'>
			{filtered ? 'Nothing in this bucket' : 'You have no alerts'}
		</Box>
		<Box fontSize='11px' color='fg.muted' lineHeight='1.45'>
			{filtered ? 'Try removing the filter to see other severities.' : 'Everything in this project looks healthy.'}
		</Box>
	</Flex>
);

interface AlertRowProps {
	entry: PanelEntry;
}

const AlertRow: React.FC<AlertRowProps> = ({ entry }) => {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree);
	const [fixer, setFixer] = useState<undefined | 'encryption' | 'extension_issue'>();
	const { alert } = entry;

	const content = renderAlertContent(alert);

	function jumpToSource() {
		const { scope } = alert;
		if (scope.kind === 'request') {
			const node = tree[scope.requestId];
			if (node && node.type === 'request') {
				dispatch(changeTab({ type: 'request', payload: scope.requestId, temporary: false }));
				closeAlertsPanel();
			}
		}
	}

	const canJump = alert.scope.kind === 'request';

	return (
		<Flex
			align='flex-start'
			gap='2.5'
			px='3'
			py='2.5'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			_last={{ borderBottomWidth: '0' }}
			_hover={{ bg: `color-mix(in srgb, ${SEVERITY_PRESETS[alert.severity].accentVar} 6%, transparent)` }}
			transition='background-color .12s ease'
		>
			<SeverityIcon severity={alert.severity} />
			<Box flex='1 1 auto' minW={0}>
				<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em' lineHeight='1.3'>
					{content.title}
				</Box>
				<Box fontSize='xs' color='fg.muted' mt='0.5' lineHeight='1.5'>
					{content.description}
				</Box>
			</Box>
			<Flex flexShrink={0} align='center' alignSelf='center' gap='1.5'>
				{canJump && (
					<Button size='sm' variant='ghost' onClick={jumpToSource}>
						{'Open'}
					</Button>
				)}
				{content.action === 'fix-encryption' && (
					<Button size='sm' onClick={() => setFixer('encryption')}>
						{'Fix'}
					</Button>
				)}
				{content.action === 'view-extension' && (
					<Button size='sm' onClick={() => setFixer('extension_issue')}>
						{'View'}
					</Button>
				)}
			</Flex>

			{fixer === 'encryption' && (
				<FixProjectEncryption
					onClose={resolved => {
						setFixer(void 0);
						if (resolved) dispatch(alertRemoveType('missing_encryption'));
					}}
				/>
			)}
			{fixer === 'extension_issue' && alert.type === 'invalid_extension' && (
				<ViewExtensionError
					assumedName={alert.payload.assumedName}
					error={alert.payload.error}
					filePath={alert.payload.filePath}
					onClose={() => setFixer(void 0)}
				/>
			)}
		</Flex>
	);
};

interface AlertContent {
	title: string;
	description: string;
	action?: 'fix-encryption' | 'view-extension';
}

function renderAlertContent(alert: Alert): AlertContent {
	switch (alert.type) {
		case 'missing_encryption':
			return {
				title: 'Project encryption issue',
				description: 'The encryption key for your project is missing.',
				action: 'fix-encryption',
			};
		case 'http_body_not_allowed':
			return {
				title: 'HTTP verb doesn’t allow a body',
				description: 'GET, HEAD, and OPTIONS requests can’t include a body. Switch verb or clear the body to send.',
			};
		case 'invalid_extension':
			return {
				title: `Unable to load “${alert.payload.assumedName}”`,
				description: 'Extension threw while loading. Open the error log to diagnose.',
				action: 'view-extension',
			};
		case 'endpoint_sync_failed':
			return {
				title: `${alert.payload.kind === 'graphql' ? 'GraphQL' : alert.payload.kind === 'grpc' ? 'gRPC' : 'OpenAPI'} sync failed — ${alert.payload.folderName}`,
				description: alert.payload.errorMessage,
			};
		case 'flight_failed':
			return {
				title: 'Last flight failed',
				description: alert.payload.errorMessage,
			};
	}
}

export default AlertsPanel;
