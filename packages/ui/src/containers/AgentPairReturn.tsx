import { Box, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { selectAgentPairingError, selectAgentStatus } from '@beak/state/agent';
import * as React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { completeAgentPairingRequested } from '../store/effects/agent';
import { useAppDispatch, useAppSelector } from '../store/redux';

import { readPairingReturnQuery } from '../services/agent';

/**
 * Landing page for `/agent/pair/return`. The agent redirects the
 * pairing tab here with `state` + `code` (or `error`) in the query
 * string. We dispatch the completion thunk and, once the status
 * settles, redirect back to the main app or surface the error.
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
				{status === 'pairing' && (
					<>
						<Spinner size='lg' color='accent.pink' />
						<Heading size='md' color='fg.default'>
							Finishing pairing…
						</Heading>
					</>
				)}
				{(status === 'unpaired' || status === 'unreachable') && error && (
					<>
						<Heading size='md' color='fg.default'>
							Pairing failed
						</Heading>
						<Text color='fg.muted'>{error}</Text>
					</>
				)}
			</VStack>
		</Box>
	);
};

export default AgentPairReturn;
