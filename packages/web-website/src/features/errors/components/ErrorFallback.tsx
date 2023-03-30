import React from 'react';
import { faBug } from '@fortawesome/free-solid-svg-icons/faBug';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { SmallContainer } from '../../../components/atoms/Container';
import { BodyRegular, Title, TitleSubtle } from '../../../components/atoms/Typography';

const ErrorFallback: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Header>
		<Container>
			<IconWrapper>
				<FontAwesomeIcon icon={faBug} />
			</IconWrapper>

			<Title>
				{'This is awkward... something broke'}
			</Title>
			<TitleSubtle>
				{'Wait a minute, how did this happen? We\'re smarter than this...'}
			</TitleSubtle>

			<Body>
				<BodyRegular>
					{'The error you\'re encountering has been reported. Please try again or a little bit later if you '}
					{'keep encountering it.'}
				</BodyRegular>
			</Body>
		</Container>
	</Header>
);

const Container = styled(SmallContainer)`
	position: relative;
`;

const Header = styled.div`
	padding-top: 80px;
	padding-bottom: 80px;
	overflow: hidden;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;

const Body = styled.div`
	margin-top: 40px;
`;

const IconWrapper = styled.div`
	position: absolute;
	top: -40px;
	right: -40px;

	opacity: .05;
	transform: rotate(20deg);

	> svg {
		width: 300px !important;
		height: 300px !important;
	}
`;

export default ErrorFallback;
