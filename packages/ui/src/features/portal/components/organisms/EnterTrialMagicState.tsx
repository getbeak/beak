import { Box, Flex, chakra } from '@chakra-ui/react';
import Squawk from '@beak/common/utils/squawk';
import Button from '@beak/ui/components/atoms/Button';
import Label from '@beak/ui/components/atoms/Label';
import { ipcNestService } from '@beak/ui/lib/ipc';
import { Loader2, Mail } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import FormError from '../../../../components/atoms/FormError';
import FormInput from '../../../../components/atoms/FormInput';
import Input from '../../../../components/atoms/Input';
import type { MagicState } from './EnterMagicState';

interface EnterTrialMagicStateProps {
	email: string;
	reset: () => void;
	inboundState?: MagicState;
}

const InlineLink = chakra('button');

const EnterTrialMagicState: React.FC<EnterTrialMagicStateProps> = ({ email, reset, inboundState }) => {
	const [working, setWorking] = useState<boolean>(false);
	const [error, setError] = useState<Squawk | undefined>(void 0);
	const [manualState, setManualState] = useState<string | undefined>(void 0);
	const manualInputRef = useRef<HTMLInputElement>(null);
	const [resend, setResend] = useState(20);
	const [canResend, setCanResend] = useState(false);

	useEffect(() => {
		if (resend >= 1) {
			window.setTimeout(() => setResend(resend - 1), 1000);
			return;
		}
		setCanResend(true);
	}, [resend]);

	useEffect(() => {
		if (!inboundState) return;
		handleMagicState(inboundState.code, inboundState.state);
	}, [inboundState]);

	useEffect(() => {
		manualInputRef.current?.focus();
	}, [manualInputRef]);

	function showManualState() {
		if (manualState === void 0) setManualState('');
	}

	function parseAndHandleMagicState() {
		const params = new URLSearchParams(manualState);
		const code = params.get('code');
		const state = params.get('state');
		const valid = Boolean(code && state);

		if (valid) handleMagicState(code!, state!);
		else setError(new Squawk('invalid_manual_state'));
	}

	function handleMagicState(code: string, state: string) {
		if (working) return;

		setWorking(true);

		ipcNestService
			.handleMagicLink({ code, state, fromPortal: true, fromTrial: true })
			.then(() => setError(void 0))
			.catch(setError)
			.finally(() => setWorking(false));
	}

	return (
		<React.Fragment>
			{manualState === void 0 && !working && (
				<Box maxW='340px' fontSize='sm' color='fg.muted' mb='2' lineHeight='1.5'>
					<Flex align='center' gap='1.5' mb='1.5' color='accent.pink'>
						<Mail size={16} />
						<Box fontSize='xs' fontWeight='600' textTransform='uppercase' letterSpacing='0.06em'>
							{'Check your inbox'}
						</Box>
					</Flex>
					<Box>
						{'Magic link is on the way to '}
						<Box as='strong' color='fg.default'>{email}</Box>
						{'.'}
					</Box>
					<Box fontSize='xs' mt='1.5' color='fg.subtle' lineHeight='1.5'>
						{'Clicking it will finish signing you into your trial. '}
						<InlineLink
							type='button'
							display='inline'
							p='0'
							bg='transparent'
							border='none'
							color='accent.pink'
							cursor='pointer'
							textDecoration='underline'
							onClick={() => showManualState()}
						>
							{'Having trouble?'}
						</InlineLink>
					</Box>
				</Box>
			)}

			{working && (
				<Flex direction='column' align='center' gap='3' py='5'>
					<Flex
						align='center'
						justify='center'
						w='48px'
						h='48px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
						color='accent.pink'
						boxShadow='0 6px 22px color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
					>
						<Loader2 size={20} style={{ animation: 'beakSpin 1s linear infinite' }} />
					</Flex>
					<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>{'Working on your trial… ✨'}</Box>
				</Flex>
			)}

			{manualState !== void 0 && (
				<FormInput>
					<Label>{'Paste the payload from the magic link page'}</Label>
					<Input
						placeholder='code=xxxx&state=yyyy'
						value={manualState}
						type='text'
						ref={manualInputRef}
						onChange={e => setManualState(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') parseAndHandleMagicState();
						}}
					/>
					<Button disabled={working} size='sm' onClick={() => parseAndHandleMagicState()}>
						{'Submit'}
					</Button>
				</FormInput>
			)}

			{error && <FormError>{getErrorMessage(error)}</FormError>}

			{!working && (
				<Flex direction='column' gap='2' mt='2' maxW='280px'>
					<Button size='sm' disabled={!canResend} onClick={() => reset()}>
						{canResend ? 'Request new magic link' : `Request new magic link (${resend}s)`}
					</Button>
					<Button size='sm' colour='secondary' onClick={() => reset()}>{'Wrong email?'}</Button>
				</Flex>
			)}
		</React.Fragment>
	);
};

function getErrorMessage(error: Squawk) {
	switch (error.code) {
		case 'no_active_subscription':
			return "You don't have an active Beak subscription.";
		case 'token_expired':
			return 'Your magic link expired. Please request a new one.';
		default:
			return `There was a problem with that magic link (${error.code})`;
	}
}

export default EnterTrialMagicState;
