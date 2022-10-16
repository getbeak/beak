import React from 'react';
import styled from 'styled-components';

const NewProjectIntro: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Wrapper>
		<WelcomeText>
			<Title>{'Beak'}</Title>
			<SubTitle>{'Welcome to your project'}</SubTitle>
		</WelcomeText>
		
	</Wrapper>
);

const Wrapper = styled.div`
	display: grid;
	grid-template-rows: 25% minmax(min-content, auto) min-content;
	grid-template-columns: 1fr 6fr 1fr 6fr 1fr;

	width: calc(100% - 48px);
	height: calc(100% - 24px);
	padding: 12px 24px;

	align-items: center;
	justify-content: center;
	flex-direction: column;

	background-color: ${props => props.theme.ui.surface};
`;

const WelcomeText = styled.div`
	grid-column: 2;
	align-self: end;
`;

const Title = styled.div`
	font-size: 30px;
	color: ${p => p.theme.ui.textMinor};
`;
const SubTitle = styled.div`
	font-size: 18px;
	color: ${p => p.theme.ui.textMinor};
`;
const SectionTitle = styled.div`
	font-size: 16px;
	font-weight: 200;
	color: ${p => p.theme.ui.textMinor};
`;

const FadedLogo = styled.div`
	width: 200px;
	height: 200px;
	background: url('./images/logo-blank.png');
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
	opacity: ${p => p.theme.theme === 'light' ? 0.3 : 0.15};
`;

export default NewProjectIntro;
