import React from 'react';
import { SmallContainer } from '@beak/website/components/atoms/Container';
import { BodyRegular, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons/faQuestionCircle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

const NotFound: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Header>
		<Container>
			<IconWrapper>
				<FontAwesomeIcon icon={faQuestionCircle} />
			</IconWrapper>

			<Title>
				{'Page not found'}
			</Title>
			<TitleSubtle>
				{'The page you seek either never existed, or just doesn\'t exist now'}
			</TitleSubtle>

			<Body>
				<BodyRegular>
					{'Maybe the '}
					<a href={'/'}>{'homepage'}</a>{' '}
					{'would be a good place to start?'}
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

export default NotFound;
