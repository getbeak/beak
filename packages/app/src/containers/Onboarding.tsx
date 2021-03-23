import Squawk from '@beak/common/utils/squawk';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import Button from '../components/atoms/Button';
import FormError from '../components/atoms/FormError';
import FormInput from '../components/atoms/FormInput';
import Input from '../components/atoms/Input';
import Label from '../components/atoms/Label';
import { actions } from '../store/nest';

const { ipcRenderer } = window.require('electron');

const Onboarding: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const [emailAddy, setEmailAddy] = useState('');
	const [manualInfo, setManualInfo] = useState('');
	const [doing, setDoing] = useState(false);
	const [error, setError] = useState<Squawk>();
	const [magicError, setMagicError] = useState<Squawk>();
	const inputRef = useRef<HTMLInputElement>();
	const [done, setDone] = useState(false);
	const [resender, setResender] = useState<number | null>(null);
	const [showManualInfo, setShowManualInfo] = useState(false);
	const enabled = emailAddy && !doing && !done;

	const magicLink = useSelector(s => s.global.nest.sendMagicLink);
	const handleMagicLink = useSelector(s => s.global.nest.handleMagicLink);

	useEffect(() => {
		ipcRenderer.on('inbound-magic-link', (_event, payload: { code: string; state: string }) => {
			const { code, state } = payload;

			dispatch(actions.handleMagicLink.request({ code, state }));
		});
	}, []);

	useEffect(() => {
		if (resender === null)
			return;

		const newVal = resender - 1;

		if (newVal >= 0)
			window.setTimeout(() => setResender(newVal), 1000);
		else
			setResender(null);
	}, [resender]);

	useEffect(() => {
		if (magicLink.fetching)
			return;

		setDoing(false);

		if (magicLink.error) {
			setError(magicLink.error);
		} else {
			setResender(30);
			setDone(true);
		}
	}, [magicLink]);

	useEffect(() => {
		if (handleMagicLink.fetching)
			return;

		if (!handleMagicLink.error)
			return;

		setMagicError(handleMagicLink.error);
		setDone(false);
		dispatch(actions.sendMagicLink.reset());
	}, [handleMagicLink]);

	useEffect(() => {
		inputRef.current?.focus();
	}, [inputRef.current]);

	function sendMagicLink() {
		inputRef.current?.blur();

		setDoing(true);
		setDone(false);
		setShowManualInfo(false);
		setManualInfo('');
		setError(void 0);
		dispatch(actions.sendMagicLink.request({ email: emailAddy }));
		dispatch(actions.handleMagicLink.reset());
	}

	function validManualInfo() {
		const params = new URLSearchParams(manualInfo);
		const code = params.get('code');
		const state = params.get('state');

		return Boolean(code && state);
	}

	function submitManualInfo() {
		const params = new URLSearchParams(manualInfo);
		const code = params.get('code')!;
		const state = params.get('state')!;

		dispatch(actions.handleMagicLink.request({ code, state }));
	}

	function getButtonContent() {
		if (doing)
			return 'Sending magic link';

		if (resender !== null)
			return `Resend (${resender}s)`;

		return 'Send magic link';
	}

	return (
		<Wrapper>
			<DragBar />

			<Container>
				<Title>{'Welcome to the super secret Beak Beta!'}</Title>
				<SubTitle>
					{'Please request a magic link with your Beta enrolled email. If you don\'t have access yet please '}
					{'visit '}
					<a href={'https://getbeak.app'}>{'https://getbeak.app'}</a>
				</SubTitle>

				<FormInput>
					<Label>{'Email address'}</Label>
					<Input
						placeholder={'taylor.swift@gmail.com'}
						value={emailAddy}
						type={'text'}
						ref={i => {
							inputRef.current = i!;
						}}
						onChange={e => setEmailAddy(e.target.value)}
						onKeyDown={e => {
							if (!enabled)
								return;

							if (e.key === 'Enter')
								sendMagicLink();
						}}
					/>
					{error && (
						<FormError>
							{`There was a problem sending the magic link (${error.code})`}
						</FormError>
					)}
				</FormInput>

				{done && (
					<React.Fragment>
						<SmolPara>
							{'Your magic link is on the way to '}
							<strong>{emailAddy}</strong>
							{'. Click the link in the email to sign into Beak.'}
						</SmolPara>

						{magicError && (
							<FormError>
								{`There was a problem with that magic link (${magicError.code})`}
							</FormError>
						)}

						{!showManualInfo && (
							<OtherSmolPara>
								{'Link in the email not opening Beak? '}
								<ShowManualInfo onClick={() => setShowManualInfo(true)}>
									{'Click here'}
								</ShowManualInfo>
							</OtherSmolPara>
						)}

						{showManualInfo && (
							<React.Fragment>
								<Label>
									{'Paste the code from the magic page below 👇'}
								</Label>
								<Input
									placeholder={'code=420&state=69'}
									value={manualInfo}
									type={'text'}
									onChange={e => setManualInfo(e.target.value)}
								/>
								<ManualButton
									disabled={!validManualInfo()}
									onClick={() => submitManualInfo()}
								>
									{'Submit magics'}
								</ManualButton>
							</React.Fragment>
						)}
					</React.Fragment>
				)}

				<ActionsWrapper>
					<Button
						disabled={!enabled}
						onClick={() => sendMagicLink()}
					>
						{getButtonContent()}
					</Button>
				</ActionsWrapper>
			</Container>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	background: ${props => props.theme.ui.background};
	height: 100vh;
`;

const DragBar = styled.div`
	-webkit-app-region: drag;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 60px;
`;

const Container = styled.div`
	position: relative;
	padding: 15px;
	padding-top: 30px;
	height: calc(100vh - 45px);

	z-index: 2;
`;

const Title = styled.h1`
	margin: 0;
	margin-bottom: 5px;
	font-size: 28px;
	font-weight: 300;
`;

const SubTitle = styled.h2`
	font-size: 14px;
	margin: 0;
	margin-bottom: 10px;
	color: ${props => props.theme.ui.textMinor};
`;

const ActionsWrapper = styled.div`
	position: absolute;
	bottom: 15px;
	right: 15px;
`;

const SmolPara = styled.p`
	margin-top: 0;
	font-size: 13px;
`;

const OtherSmolPara = styled(SmolPara)`
	margin-top: 0px;
	color: ${p => p.theme.ui.textMinor};
`;

const ShowManualInfo = styled.a`
	color: ${p => p.theme.ui.primaryFill};
	cursor: pointer;
`;

const ManualButton = styled(Button)`
	margin-top: 5px;
`;

export default Onboarding;
