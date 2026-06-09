import { selectAgentPairingError, selectAgentStatus } from '@beak/state/agent';
import { Box, Button, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendlyPairingError, readPairingReturnQuery } from '../services/agent';
import { completeAgentPairingRequested } from '../store/effects/agent';
import { useAppDispatch, useAppSelector } from '../store/redux';

/**
 * Landing page for `/agent/pair/return`. The agent redirects the
 * pairing tab here with `state` + `code` (or `error`) in the query
 * string. We dispatch the completion thunk and, once the status
 * settles, redirect back to the main app or surface the error with
 * a back-to-app action so the user is never stuck on the page.
 *
 * NOTE: this is a *fresh* browser tab opened via `window.open` from the
 * main app. Its redux store boots from `initialAgentState`, so
 * `status` starts as `idle` until the completion effect dispatches.
 * Every status branch must render *something* (spinner or copy) —
 * a blank canvas is the stranding bug this file is here to avoid.
 *
 * Retries can't happen here either, for the same reason: the slice
 * has no `baseUrl` and `startAgentPairingRequested` would just fail
 * with `agent_unreachable`. Recovery actions point back to the main
 * tab.
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

	const onBack = useCallback(() => {
		navigate('/', { replace: true });
	}, [navigate]);

	const showFailure = (status === 'unpaired' || status === 'unreachable') && Boolean(error);
	const showSpinner =
		status === 'idle' || status === 'discovering' || status === 'pairing' || status === 'verifying';

	let spinnerLabel = 'Finishing pairing…';
	if (status === 'verifying') spinnerLabel = 'Verifying the agent…';
	else if (status === 'idle' || status === 'discovering') spinnerLabel = 'Completing pairing…';

	const friendly = showFailure ? friendlyPairingError(error) : null;

	return (
		<Box minH='100vh' display='flex' alignItems='center' justifyContent='center' bg='bg.canvas'>
			<VStack gap={4} maxW='420px' textAlign='center'>
				{status === 'paired' && (
					<>
						<Heading size='md' color='fg.default'>Paired with the Beak agent</Heading>
						<Text color='fg.muted'>Sending you back to your project…</Text>
					</>
				)}
				{showSpinner && (
					<>
						<Spinner size='lg' color='accent.pink' aria-label={spinnerLabel} />
						<Heading size='md' color='fg.default'>
							{spinnerLabel}
						</Heading>
					</>
				)}
				{showFailure && friendly && (
					<>
						<Heading size='md' color='fg.default'>{friendly.title}</Heading>
						<Text color='fg.muted'>{friendly.detail}</Text>
						<HStack gap={3}>
							<Button onClick={onBack} bg='accent.pink' color='fg.onAccent' size='sm'>
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
