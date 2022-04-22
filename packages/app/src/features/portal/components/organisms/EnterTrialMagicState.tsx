import React, { useEffect, useRef, useState } from 'react';
import Button from '@beak/app/components/atoms/Button';
import Label from '@beak/app/components/atoms/Label';
import { ipcNestService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';
import styled from 'styled-components';

import FormError from '../../../../components/atoms/FormError';
import FormInput from '../../../../components/atoms/FormInput';
import Input from '../../../../components/atoms/Input';
import { MagicState } from './EnterMagicState';

interface EnterTrialMagicStateProps {
	email: string;
	reset: () => void;
	inboundState?: MagicState;
}

const EnterTrialMagicState: React.FunctionComponent<React.PropsWithChildren<EnterTrialMagicStateProps>> = props => {
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
			.handleMagicLink({ code, state, fromPortal: true, fromTrial: true })
			.then(() => setError(void 0))
			.catch(setError)
			.finally(() => setWorking(false));
	}

	return (
		<React.Fragment>
			{manualState === void 0 && (
				<React.Fragment>
					{!working && (
						<React.Fragment>
							<Text>
								{'Your magic link is on the way to '}<b>{email}</b>{'.'}
							</Text>
							<Text>
								{'Clicking the link in the email will finish signing you into your Beak trial. '}
								<HelpButton onClick={() => showManualState()}>{'Having trouble with the link?'}</HelpButton>
							</Text>
						</React.Fragment>
					)}

					{working && (
						<Text>
							{'Working away on your magic link, make a wish 🪄 '}
						</Text>
					)}
				</React.Fragment>
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
				<ManualButton disabled={!canResend} onClick={() => reset()}>
					{canResend && 'Request new magic link'}
					{!canResend && `Request new magic link (${resend}s)`}
				</ManualButton>
			)}
		</React.Fragment>
	);
};

const Text = styled.div`
	font-size: 14px;
	margin: 5px 0;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
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

export default EnterTrialMagicState;
