import Button from '@beak/app/components/atoms/Button';
import Label from '@beak/app/components/atoms/Label';
import { ipcNestService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import FormError from '../../../../components/atoms/FormError';
import FormInput from '../../../../components/atoms/FormInput';
import Input from '../../../../components/atoms/Input';
import ActionsWrapper from '../atoms/ActionsWrapper';

export interface MagicState {
	code: string;
	state: string;
}

interface EnterMagicStateProps {
	email: string;
	reset: () => void;
	inboundState?: MagicState;
}

const EnterMagicState: React.FunctionComponent<EnterMagicStateProps> = props => {
	const { email, reset, inboundState } = props;
	const [working, setWorking] = useState<boolean>(false);
	const [error, setError] = useState<Squawk | undefined>(void 0);
	const [manualState, setManualState] = useState<string | undefined>(void 0);
	const manualInputRef = useRef<HTMLInputElement>(null);

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

		if (!valid) {
			setError(new Squawk('invalid_manual_state'));

			return;
		}

		handleMagicState(code!, state!);
	}

	function handleMagicState(code: string, state: string) {
		if (working)
			return;

		setWorking(true);

		ipcNestService
			.handleMagicLink({ code, state, fromOnboarding: true })
			.then(() => {
				setError(void 0);
			})
			.catch(error => {
				setError(error);
			})
			.finally(() => {
				setWorking(false);
			});
	}

	return (
		<React.Fragment>
			{!working && (
				<Paragraph>
					{'Your magic link is on the way to '}
					<b>{email}</b>{'. '}
					{'Clicking the link in the email will finish signing you into Beak. '}
					<HelpButton onClick={() => showManualState()}>{'Having trouble with the link?'}</HelpButton>
				</Paragraph>
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

			{error && (
				<FormError>
					{`There was a problem with that magic link (${error.code})`}
				</FormError>
			)}

			<ActionsWrapper>
				<Button onClick={() => reset()}>
					{'Request new magic link'}
				</Button>
			</ActionsWrapper>
		</React.Fragment>
	);
};

const Paragraph = styled.p`
	font-size: 14px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const HelpButton = styled.span`
	cursor: pointer;
	color: ${p => p.theme.ui.textHighlight};
`;

const ManualButton = styled(Button)`
	margin-top: 5px;
`;

export default EnterMagicState;
