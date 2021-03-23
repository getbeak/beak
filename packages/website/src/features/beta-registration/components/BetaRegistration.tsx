import React from 'react';
import styled from 'styled-components';

const BetaRegistration: React.FunctionComponent = () => (
	<Wrapper>
		<Title>{'Join the flock!'}</Title>
		<Body>
			{'Beak is currently in closed Beta. Register your interest to gain early access!'}
		</Body>

		<InterestForm>
			<form action={'https://red.us2.list-manage.com/subscribe/post?u=d62a1e75f710146815bf3f9a7&id=e580e6811f'} method={'POST'}>
				<Input
					placeholder={'taylor.swift@getbeak.app'}
					name={'EMAIL'}
					id={'mce-EMAIL'}
					type={'email'}
					required
					autoFocus
				/>

				<Button type={'submit'} value={'Take flight'} />
			</form>
		</InterestForm>
	</Wrapper>
);

const Wrapper = styled.div`
	margin: 0 auto;
	margin-top: 40px;
	border-radius: 5px;
	background: #5d5da066;
	max-width: 700px;

	padding: 15px 20px;
	text-align: left;
`;

const Title = styled.b`
	font-size: 20px;
`;

const Body = styled.p`
	margin-top: 5px;
`;

const InterestForm = styled.div`

`;

const Input = styled.input`
	background-color: ${p => p.theme.ui.surface};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	width: 100%;
	box-sizing: border-box;

	font-size: 17px;
	padding: 6px 8px;
	border-radius: 4px;

	&::placeholder {
		color: ${p => p.theme.ui.textMinor};
	}

	&:focus {
		outline: 0;
		border-color: ${p => p.theme.ui.primaryFill};
		box-shadow: 0 0 0 3px ${p => p.theme.ui.primaryFill}AA;
		background: ${p => p.theme.ui.surfaceHighlight};
	}
`;

const Button = styled.input`
	margin-top: 5px;
	padding: 6px 8px;
	border-radius: 4px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border: 1px solid ${p => p.theme.ui.primaryFill};
	background-color: ${p => p.theme.ui.primaryFill};

	width: 100%;
	font-size: 17px;
`;

export default BetaRegistration;
