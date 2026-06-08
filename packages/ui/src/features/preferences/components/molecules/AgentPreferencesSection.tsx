import {
	selectAgentBaseUrl,
	selectAgentRoutingMode,
	selectAgentStatus,
	selectAgentVersion,
	setRoutingMode,
} from '@beak/state/agent';
import { useAppDispatch, useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';

import { getLocalAgentCapability } from '../../../../services/agent';
import { revokeAgentLocally } from '../../../../store/effects/agent';
import Row from '../atoms/Row';
import Section from '../atoms/Section';
import SegmentedControl from '../atoms/SegmentedControl';

const ROUTING_ITEMS = [
	{ key: 'agent-when-available' as const, label: 'When available' },
	{ key: 'agent-only' as const, label: 'Agent only' },
	{ key: 'browser-only' as const, label: 'Browser only' },
];

/**
 * Web-host-only preferences section for the local agent. Renders
 * nothing when the host's `localAgent` capability is `'unsupported'`
 * (e.g. Electron). The controls map to fields on the agent slice;
 * persisting them to disk is a follow-up — for now they live for the
 * session, which matches "I want to try browser-only quickly" UX.
 */
const AgentPreferencesSection: React.FC = () => {
	const dispatch = useAppDispatch();
	const status = useAppSelector(selectAgentStatus);
	const baseUrl = useAppSelector(selectAgentBaseUrl);
	const version = useAppSelector(selectAgentVersion);
	const routingMode = useAppSelector(selectAgentRoutingMode);

	if (getLocalAgentCapability() === 'unsupported') return null;

	return (
		<Section title='Local agent'>
			<Row label='Request routing' description='Pick when the web host should route flights through the local agent.'>
				<SegmentedControl
					ariaLabel='Agent routing mode'
					items={ROUTING_ITEMS}
					value={routingMode}
					onChange={mode => dispatch(setRoutingMode(mode))}
				/>
			</Row>
			<Row label='Agent status' description={statusDescription({ status, baseUrl, version })}>
				{status === 'paired' && (
					<button
						type='button'
						onClick={() => dispatch(revokeAgentLocally())}
						style={{
							fontSize: '12px',
							padding: '4px 10px',
							borderRadius: '4px',
							border: '1px solid var(--beak-colors-border-default)',
							background: 'transparent',
							color: 'var(--beak-colors-fg-muted)',
							cursor: 'pointer',
						}}
					>
						{'Forget on this device'}
					</button>
				)}
			</Row>
		</Section>
	);
};

function statusDescription(input: {
	status: ReturnType<typeof selectAgentStatus>;
	baseUrl?: string;
	version?: string;
}): string {
	const { status, baseUrl, version } = input;
	switch (status) {
		case 'paired':
			return `Paired with agent ${version ?? ''} at ${baseUrl ?? '—'}.`;
		case 'unpaired':
			return `Agent reachable at ${baseUrl ?? '—'}, not paired yet.`;
		case 'unreachable':
			return 'No agent found on the local port range.';
		case 'pairing':
			return 'Pairing in progress — finish in the agent tray.';
		case 'verifying':
			return 'Verifying agent identity…';
		case 'impostor':
			return 'A loopback process failed the agent verification challenge.';
		case 'discovering':
			return 'Scanning the local port range.';
		case 'idle':
			return 'Discovery has not run yet.';
	}
}

export default AgentPreferencesSection;
