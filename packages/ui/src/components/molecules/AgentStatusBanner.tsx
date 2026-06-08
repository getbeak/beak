import {
	selectAgentBaseUrl,
	selectAgentPairingError,
	selectAgentStatus,
} from '@beak/state/agent';
import { useAppDispatch, useAppSelector } from '@beak/ui/store/redux';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { AlertTriangle, Plug, ServerOff, ShieldAlert, Zap } from 'lucide-react';
import * as React from 'react';
import { useCallback } from 'react';

import { getLocalAgentCapability } from '../../services/agent';
import { discoverAgentRequested, startAgentPairingRequested } from '../../store/effects/agent';

// TODO(docs): replace with the canonical install page once the agent
// has GA download links. Keeping the URL in one place so updating it
// is a single edit.
const AGENT_INSTALL_URL = 'https://docs.getbeak.app/agent';

interface BannerContent {
	tone: 'pink' | 'alert' | 'warning';
	icon: React.ReactNode;
	label: string;
	body: string;
	primaryLabel?: string;
	onPrimary?: () => void;
	secondaryLabel?: string;
	onSecondary?: () => void;
}

/**
 * Trim the protocol and IP out of a localhost URL so the banner copy
 * stays readable. `http://127.0.0.1:47821` → `:47821`. Falls back to
 * the raw input when the URL is not a localhost shape.
 */
function compactLoopback(url?: string): string {
	if (!url) return '';
	const match = url.match(/^https?:\/\/127\.0\.0\.1(:\d+)?/);
	return match ? (match[1] ?? '') : url;
}

/**
 * Status banner for the local agent. Renders only when the runtime's
 * `localAgent` capability is `'optional'` or `'required'` AND the state
 * machine is in a non-steady state. The steady-state (`paired`) renders
 * nothing so a happy session is silent.
 */
const AgentStatusBanner: React.FC = () => {
	const dispatch = useAppDispatch();
	const status = useAppSelector(selectAgentStatus);
	const baseUrl = useAppSelector(selectAgentBaseUrl);
	const pairingError = useAppSelector(selectAgentPairingError);

	const capability = getLocalAgentCapability();

	const onPair = useCallback(() => {
		dispatch(
			startAgentPairingRequested({
				returnUrl: `${window.location.origin}/agent/pair/return`,
			}),
		);
	}, [dispatch]);

	const onRescan = useCallback(() => {
		dispatch(discoverAgentRequested());
	}, [dispatch]);

	if (capability === 'unsupported') return null;

	const content = renderContent({ status, baseUrl, pairingError, onPair, onRescan });
	if (!content) return null;

	const tone = content.tone;
	const accentVar = `var(--beak-colors-accent-${tone})`;

	return (
		<Flex
			role='status'
			aria-label='agent-status'
			align='center'
			gap='3'
			px='3.5'
			py='2'
			borderBottomWidth='1px'
			borderColor={`color-mix(in srgb, ${accentVar} 22%, var(--beak-colors-border-subtle))`}
			color='fg.default'
			fontSize='xs'
			css={{
				background: `linear-gradient(90deg, color-mix(in srgb, ${accentVar} 22%, transparent), color-mix(in srgb, ${accentVar} 8%, transparent) 60%, transparent)`,
				borderLeft: `3px solid ${accentVar}`,
			}}
		>
			<Flex
				align='center'
				justify='center'
				flexShrink={0}
				w='24px'
				h='24px'
				borderRadius='md'
				bg={`color-mix(in srgb, ${accentVar} 14%, transparent)`}
				borderWidth='1px'
				borderColor={`color-mix(in srgb, ${accentVar} 28%, transparent)`}
				color={`accent.${tone}`}
			>
				{content.icon}
			</Flex>
			<Box flex='1 1 auto' minW='0'>
				<Text
					as='span'
					fontWeight='700'
					color={`accent.${tone}`}
					textTransform='uppercase'
					fontSize='10px'
					letterSpacing='0.06em'
					mr='2'
				>
					{content.label}
				</Text>
				<Text as='span' color='fg.muted'>
					{content.body}
				</Text>
			</Box>
			{content.secondaryLabel && content.onSecondary && (
				<Button
					type='button'
					size='xs'
					variant='ghost'
					color='fg.muted'
					onClick={content.onSecondary}
				>
					{content.secondaryLabel}
				</Button>
			)}
			{content.primaryLabel && content.onPrimary && (
				<Button
					type='button'
					size='xs'
					bg={`accent.${tone}`}
					color='fg.onAccent'
					borderRadius='sm'
					px='3'
					fontWeight='600'
					onClick={content.onPrimary}
					_hover={{ filter: 'brightness(1.1)' }}
					_active={{ transform: 'scale(0.97)' }}
				>
					{content.primaryLabel}
				</Button>
			)}
		</Flex>
	);
};

function renderContent(input: {
	status: ReturnType<typeof selectAgentStatus>;
	baseUrl?: string;
	pairingError?: string;
	onPair: () => void;
	onRescan: () => void;
}): BannerContent | null {
	const { status, baseUrl, pairingError, onPair, onRescan } = input;

	switch (status) {
		case 'idle':
		case 'discovering':
		case 'verifying':
		case 'paired':
			return null;
		case 'unreachable':
			return {
				tone: 'warning',
				icon: <ServerOff size={12} strokeWidth={2.2} />,
				label: 'Agent',
				body: 'Install or start the Beak agent to fire requests beyond browser CORS.',
				primaryLabel: 'Re-scan',
				onPrimary: onRescan,
				secondaryLabel: 'Get the agent',
				onSecondary: () => window.open(AGENT_INSTALL_URL, '_blank', 'noopener,noreferrer'),
			};
		case 'unpaired': {
			const where = compactLoopback(baseUrl);
			const body = pairingError
				? `Pairing didn't finish: ${pairingError}. Try again.`
				: `Pair this browser with the agent on ${where || 'localhost'} to route requests through it.`;
			return {
				tone: 'pink',
				icon: <Plug size={12} strokeWidth={2.2} />,
				label: pairingError ? 'Agent unpaired' : 'Agent found',
				body,
				primaryLabel: pairingError ? 'Try again' : 'Pair agent',
				onPrimary: onPair,
			};
		}
		case 'pairing':
			return {
				tone: 'pink',
				icon: <Zap size={12} strokeWidth={2.2} />,
				label: 'Pairing',
				body: 'Approve the request in the agent tray, then return to this tab.',
			};
		case 'impostor':
			return {
				tone: 'alert',
				icon: <ShieldAlert size={12} strokeWidth={2.2} />,
				label: 'Verification failed',
				body: 'The loopback endpoint did not prove ownership of your token. Check for impostor processes and re-scan.',
				primaryLabel: 'Re-scan',
				onPrimary: onRescan,
			};
		default: {
			const exhaustive: never = status;
			void exhaustive;
			return {
				tone: 'warning',
				icon: <AlertTriangle size={12} strokeWidth={2.2} />,
				label: 'Agent',
				body: 'Unknown agent state.',
			};
		}
	}
}

export default AgentStatusBanner;
