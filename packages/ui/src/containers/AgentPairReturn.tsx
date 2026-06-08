import { selectAgentPairingError, selectAgentStatus } from '@beak/state/agent';
import { Box, Button, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { readPairingReturnQuery } from '../services/agent';
import { completeAgentPairingRequested, startAgentPairingRequested } from '../store/effects/agent';
import { useAppDispatch, useAppSelector } from '../store/redux';

/**
 * Landing page for `/agent/pair/return`. The agent redirects the
 * pairing tab here with `state` + `code` (or `error`) in the query
 * string. We dispatch the completion thunk and, once the status
 * settles, redirect back to the main app or surface the error with
 * a retry / back-to-app action so the user is never stuck on the page.
 */
const AgentPairReturn: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const status = useAppSelector(selectAgentStatus);
	const error = useAppSelector(selectAgentPairingError);

	useEffect(() => {
		const query = readPairingReturnQuery();
		dispatch(completeAgentPairingRequested(query));
	}, [dispatch]);

	useEffect(() => {
		if (status === 'paired') {
			const timer = window.setTimeout(() => navigate('/', { replace: true }), 800);
			return () => window.clearTimeout(timer);
		}
		return undefined;
	}, [status, navigate]);

	const onRetry = useCallback(() => {
		dispatch(
			startAgentPairingRequested({
				returnUrl: `${window.location.origin}/agent/pair/return`,
			}),
		);
	}, [dispatch]);

	const onBack = useCallback(() => {
		navigate('/', { replace: true });
	}, [navigate]);

	const showFailure = (status === 'unpaired' || status === 'unreachable') && Boolean(error);

	return (
		<Box minH='100vh' display='flex' alignItems='center' justifyContent='center' bg='bg.canvas'>
			<VStack gap={4} maxW='420px' textAlign='center'>
				{status === 'paired' && (
					<>
						<Heading size='md' color='fg.default'>
							Paired with the Beak agent
						</Heading>
						<Text color='fg.muted'>Sending you back to your project…</Text>
					</>
				)}
				{(status === 'pairing' || status === 'verifying') && (
					<>
						<Spinner size='lg' color='accent.pink' />
						<Heading size='md' color='fg.default'>
							{status === 'verifying' ? 'Verifying the agent…' : 'Finishing pairing…'}
						</Heading>
					</>
				)}
				{showFailure && (
					<>
						<Heading size='md' color='fg.default'>
							Pairing failed
						</Heading>
						<Text color='fg.muted'>{error}</Text>
						<HStack gap={3}>
							<Button onClick={onRetry} bg='accent.pink' color='fg.onAccent' size='sm'>
								Try again
							</Button>
							<Button onClick={onBack} variant='ghost' color='fg.muted' size='sm'>
								Back to Beak
							</Button>
						</HStack>
					</>
				)}
			</VStack>
		</Box>
	);
};

export default AgentPairReturn;
