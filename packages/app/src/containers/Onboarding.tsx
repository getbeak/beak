import crpc from 'crpc';
import React, { useState } from 'react';
import styled from 'styled-components';

import Button from '../components/atoms/Button';
import FormInput from '../components/atoms/FormInput';
import Input from '../components/atoms/Input';
import Label from '../components/atoms/Label';

const Onboarding: React.FunctionComponent = () => {
	const [emailAddy, setEmailAddy] = useState('');
	const enabled = emailAddy;

	return (
		<Wrapper>
			<DragBar />

			<Container>
				<Title>{'Welcome to the Beak Alpha α!'}</Title>
				<SubTitle>
					{'Before you get started please enter your alpha enrolled email!'}
				</SubTitle>

				<FormInput>
					<Label>{'Email address'}</Label>
					<Input
						placeholder={'taylor.swift@gmail.com'}
						value={emailAddy}
						onChange={e => setEmailAddy(e.target.value)}
					/>
				</FormInput>

				<ActionsWrapper>
					<Button
						disabled={!enabled}
					>
						{'Send magic link'}
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
	height: calc(100vh - 30px);

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
