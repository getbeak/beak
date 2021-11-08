import { Card, CardBody, CardGrid, CardIcons, CardTitle } from '@beak/website/components/atoms/Card';
import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import { faSuperpowers } from '@fortawesome/free-brands-svg-icons/faSuperpowers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import Helmet from 'react-helmet';
import { Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

const Purchased: React.FunctionComponent = () => {
	const theme = useTheme();

	return (
		<React.Fragment>
			<Helmet defer={false}>
				<title>{'Subscribed :: Beak'}</title>
			</Helmet>
			<Header>
				<SmallContainer>
					<TitleSubtle>{'🎉'}</TitleSubtle>
					<Title>{'Thank you for subscribing'}</Title>
					<SubTitle>{'Welcome to the flock!'}</SubTitle>
				</SmallContainer>
			</Header>
			<Body>
				<SmallContainer>
					<CardGrid>
						<Card>
							<CardIcons>
								<FontAwesomeIcon
									color={theme.ui.primaryFill}
									icon={faSuperpowers}
									size={'2x'}
								/>
							</CardIcons>
							<CardTitle>
								{'Getting started'}
							</CardTitle>
							<CardBody>
								{'Welcome to Beak! To get started, just head to the '}
								<Link to={'/#downloads'}>{'downloads'}</Link>{' page '}
								{'to download Beak for your device. Updates will of '}
								{'course be automatically downloaded in future.'}
							</CardBody>
						</Card>
						<Card>
							<CardIcons>
								<FontAwesomeIcon
									color={theme.ui.primaryFill}
									icon={faSuperpowers}
									size={'2x'}
								/>
							</CardIcons>
							<CardTitle>
								{'Signing in'}
							</CardTitle>
							<CardBody>
								{'Signing into Beak after you have downloaded it couldn\'t be easier. Simply enter '}
								{'use the email address you used when you subscribed and you\'ll get a magic link '}
								{'sent to your inbox. If you need a hand, check out this '}
								<a
									target={'_blank'}
									rel={'noopener noreferrer nofollow'}
									href={'https://beakapp.notion.site/User-licenses-and-authentication-37ccc436c3e648498b16a22e0e27a01a'}
								>
									{'article'}
								</a>{'.'}
							</CardBody>
						</Card>
						<Card>
							<CardIcons>
								<FontAwesomeIcon
									color={theme.ui.primaryFill}
									icon={faSuperpowers}
									size={'2x'}
								/>
							</CardIcons>
							<CardTitle>
								{'Documentation & features'}
							</CardTitle>
							<CardBody>
								{'We\'re still working on our documentation based on feedback, but you can check out '}
								{'what we have already '}
								<a
									target={'_blank'}
									rel={'noopener noreferrer nofollow'}
									href={'https://beakapp.notion.site/Beak-guide-1c0d46949f9a4558998b183abc3a2b73'}
								>
									{'over here'}
								</a>
								{'. And of course there is the feature overview available on our '}
								<Link to={'/#features'}>{'home page'}</Link>{'.'}
							</CardBody>
						</Card>
						<Card>
							<CardIcons>
								<FontAwesomeIcon
									color={theme.ui.primaryFill}
									icon={faSuperpowers}
									size={'2x'}
								/>
							</CardIcons>
							<CardTitle>
								{'Support'}
							</CardTitle>
							<CardBody>
								{'If you need a hand with anything, have some feedback, you can reach out to us '}
								{'either on '}
								<a
									target={'_blank'}
									rel={'noopener noreferrer nofollow'}
									href={'https://twitter.com/beakapp'}
								>
									{'Twitter'}
								</a>
								{', or via '}
								<a
									target={'_blank'}
									rel={'noopener noreferrer nofollow'}
									href={'mailto:support@getbeak.app'}
								>
									{'Email'}
								</a>{'.'}
							</CardBody>
						</Card>
					</CardGrid>

					<OutroTitle>
						{'Thank you again for subscribing to Beak, it really means a lot to us!'}
					</OutroTitle>
				</SmallContainer>
			</Body>
		</React.Fragment>
	);
};

export default Purchased;

const Header = styled.div`
	padding-top: 80px;
	padding-bottom: 80px;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;

const Body = styled.div`
	padding-top: 40px;
`;

const OutroTitle = styled.h2`
	margin-top: 30px;
	text-align: center;
	font-size: 25px;
	font-weight: 100;
	color: ${p => p.theme.ui.textOnFill};
`;
