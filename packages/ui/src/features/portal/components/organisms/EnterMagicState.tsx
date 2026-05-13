import { Box, Flex, chakra } from '@chakra-ui/react';

const InlineLink = chakra('button');
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

export interface MagicState {
	code: string;
	state: string;
}

interface EnterMagicStateProps {
	email: string;
	reset: () => void;
	inboundState?: MagicState;
}

const EnterMagicState: React.FC<EnterMagicStateProps> = ({ email, reset, inboundState }) => {
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
			.handleMagicLink({ code, state, fromPortal: true })
			.then(() => setError(void 0))
			.catch(setError)
			.finally(() => setWorking(false));
	}

	return (
		<React.Fragment>
			{!working && (
				<Box
					mx='auto'
					maxW='340px'
					textAlign='center'
					fontSize='sm'
					color='fg.muted'
					mb='2'
				>
					<Flex align='center' justify='center' mb='3'>
						<Flex
							align='center'
							justify='center'
							w='48px'
							h='48px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
							color='accent.pink'
							boxShadow='0 6px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 25%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
						>
							<Mail size={20} strokeWidth={1.8} />
						</Flex>
					</Flex>
					<Box>
						{'Magic link is on the way to '}
						<Box as='strong' color='fg.default'>{email}</Box>
					</Box>
					<Box fontSize='xs' mt='1.5' color='fg.subtle' lineHeight='1.5'>
						{'Clicking the link in the email will finish signing you in. '}
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
						<Loader2 size={20} style={{ animation: 'beakPortalSpin 1s linear infinite' }} />
					</Flex>
					<Box fontSize='sm' fontWeight='600' color='fg.default'>{'Working on your magic link… ✨'}</Box>
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
				<Flex direction='column' gap='2' mt='2' maxW='280px' mx='auto'>
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

export default EnterMagicState;
