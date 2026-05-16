import type { GitOperation, GitOperationState } from '@beak/state/git';
import { Box, Flex } from '@chakra-ui/react';
import { AlertOctagon, CheckCircle2, Loader2 } from 'lucide-react';
import * as React from 'react';

interface OperationStatusProps {
	state: GitOperationState;
}

const OperationStatus: React.FC<OperationStatusProps> = ({ state }) => {
	if (state.phase === 'idle') return null;

	const tone =
		state.phase === 'error'
			? 'var(--beak-colors-accent-alert)'
			: state.phase === 'success'
				? 'var(--beak-colors-accent-teal)'
				: 'var(--beak-colors-accent-indigo)';

	const Icon = state.phase === 'error' ? AlertOctagon : state.phase === 'success' ? CheckCircle2 : Loader2;

	const label = (() => {
		if (state.phase === 'pending') {
			return `${verb(state.op)}…`;
		}
		if (state.phase === 'success') {
			const detail = state.notice ? ` (${state.notice})` : '';
			return `${pastVerb(state.op)}${detail}`;
		}
		return state.error;
	})();

	return (
		<Flex
			align='center'
			gap='2'
			px='3'
			py='2'
			borderWidth='1px'
			borderRadius='md'
			css={{
				background: `color-mix(in srgb, ${tone} 8%, transparent)`,
				borderColor: `color-mix(in srgb, ${tone} 30%, transparent)`,
				color: tone,
			}}
		>
			<Box
				css={{
					animation: state.phase === 'pending' ? 'sc-spin 1.1s linear infinite' : 'none',
				}}
			>
				<Icon size={13} />
				<style>{'@keyframes sc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
			</Box>
			<Box flex='1 1 auto' fontSize='xs' color='fg.default'>
				{label}
			</Box>
		</Flex>
	);
};

function verb(op: GitOperation): string {
	switch (op) {
		case 'commit': return 'Committing';
		case 'push': return 'Pushing';
		case 'pull': return 'Pulling';
		case 'fetch': return 'Fetching';
		case 'checkout': return 'Switching branch';
		default: return 'Working';
	}
}

function pastVerb(op: GitOperation): string {
	switch (op) {
		case 'commit': return 'Commit created';
		case 'push': return 'Pushed';
		case 'pull': return 'Pulled';
		case 'fetch': return 'Fetched';
		case 'checkout': return 'Switched branch';
		default: return 'Done';
	}
}

export default OperationStatus;
