import React, { useEffect, useRef, useState } from 'react';
import Button from '@beak/app/components/atoms/Button';
import Label from '@beak/app/components/atoms/Label';
import { ipcNestService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';
import styled from 'styled-components';

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

const EnterMagicState: React.FC<React.PropsWithChildren<EnterMagicStateProps>> = props => {
	const { email, reset, inboundState } = props;
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
		if (!inboundState)
			return;

		handleMagicState(inboundState.code, inboundState.state);
	}, [inboundState]);

	useEffect(() => {
		manualInputRef.current?.focus();
	}, [manualInputRef]);

	function showManualState() {
		if (manualState === void 0)
			setManualState('');
	}

	function parseAndHandleMagicState() {
		const params = new URLSearchParams(manualState);
		const code = params.get('code');
		const state = params.get('state');
		const valid = Boolean(code && state);

		if (valid)
			handleMagicState(code!, state!);
		else
			setError(new Squawk('invalid_manual_state'));
	}

	function handleMagicState(code: string, state: string) {
		if (working)
			return;

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
				<React.Fragment>
					<Paragraph $center>
						{'Your magic link is on the way to'}<br />
						<b>{email}</b>
					</Paragraph>
					<Paragraph>
						{'Clicking the link in the email will finish signing you into Beak. '}
						<HelpButton onClick={() => showManualState()}>{'Having trouble with the link?'}</HelpButton>
					</Paragraph>
				</React.Fragment>
			)}

			{working && (
				<Paragraph>
					{'Working away on your magic link, make a wish 🪄 '}
				</Paragraph>
			)}

			{manualState !== void 0 && (
				<React.Fragment>
					<FormInput>
						<Label>{'If the link isn\'t working, please paste the payload from magic link site below 👇'}</Label>
						<Input
							placeholder={'code=xxxx&state=yyyy'}
							value={manualState}
							type={'text'}
							ref={manualInputRef}
							onChange={e => setManualState(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter')
									parseAndHandleMagicState();
							}}
						/>
						<ManualButton
							disabled={working}
							size={'sm'}
							onClick={() => parseAndHandleMagicState()}
						>
							{'Submit'}
						</ManualButton>
					</FormInput>
				</React.Fragment>
			)}

			{error && <FormError>{getErrorMessage(error)}</FormError>}

			{!working && (
				<React.Fragment>
					<ManualButton disabled={!canResend} onClick={() => reset()}>
						{canResend && 'Request new magic link'}
						{!canResend && `Request new magic link (${resend}s)`}
					</ManualButton>
					<ManualButton onClick={() => reset()}>
						{'Wrong email?'}
					</ManualButton>
				</React.Fragment>
			)}
		</React.Fragment>
	);
};

const Paragraph = styled.p<{ $center?: boolean }>`
	font-size: 14px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	text-align: ${p => p.$center ? 'center' : 'inherit'};
`;

const HelpButton = styled.span`
	cursor: pointer;
	color: ${p => p.theme.ui.textHighlight};
`;

const ManualButton = styled(Button)`
	margin-top: 5px;
	width: 100%;
`;

function getErrorMessage(error: Squawk) {
	switch (error.code) {
		case 'no_active_subscription':
			return 'You don\'t have an active Beak subscription.';

		case 'token_expired':
			return 'Your magic link expired. Please request a new one.';

		default:
			return `There was a problem with that magic link (${error.code})`;
	}
}

export default EnterMagicState;
