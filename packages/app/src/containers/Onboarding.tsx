import Squawk from '@beak/common/utils/squawk';
import React, { useEffect, useState } from 'react';
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
	const magicLink = useSelector(s => s.global.nest.sendMagicLink);
	const [doing, setDoing] = useState(false);
	const [error, setError] = useState<Squawk>();
	const [done, setDone] = useState(false);
	const enabled = emailAddy && !doing && !done;

	useEffect(() => {
		ipcRenderer.on('inbound-magic-link', (_event, payload: { code: string; state: string }) => {
			const { code, state } = payload;

			dispatch(actions.handleMagicLink.request({ code, state }));
		});
	}, []);

	useEffect(() => {
		if (magicLink.fetching)
			return;

		setDoing(false);

		if (magicLink.error)
			setError(magicLink.error);
		else
			setDone(true);
	}, [magicLink]);

	function sendMagicLink() {
		setDoing(true);
		setDone(false);
		setError(void 0);
		dispatch(actions.sendMagicLink.request({ email: emailAddy }));
	}

	function getButtonContent() {
		if (doing)
			return 'Sending magic link';

		if (done)
			return 'Magic link sent!';

		return 'Send magic link';
	}

	return (
		<Wrapper>
			<DragBar />

			<Container>
				<Title>{'Welcome to the Beak Alpha α!'}</Title>
				<SubTitle>
					{'To get started please enter your alpha enrolled email'}
				</SubTitle>

				<FormInput>
					<Label>{'Email address'}</Label>
					<Input
						placeholder={'taylor.swift@gmail.com'}
						value={emailAddy}
						type={'text'}
						onChange={e => setEmailAddy(e.target.value)}
					/>
					{error && (
						<FormError>
							{`There was a problem sending the magic link (${error.code})`}
						</FormError>
					)}
				</FormInput>

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
	height: 40px;
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

export default Onboarding;
