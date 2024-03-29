import React from 'react';
import Helmet from 'react-helmet';
import { Card, CardBody, CardGrid, CardIcons, CardTitle } from '@beak/apps-web-marketing/components/atoms/Card';
import { SmallContainer } from '@beak/apps-web-marketing/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/apps-web-marketing/components/atoms/Typography';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons/faBookOpen';
import { faHatWizard } from '@fortawesome/free-solid-svg-icons/faHatWizard';
import { faLifeRing } from '@fortawesome/free-solid-svg-icons/faLifeRing';
import { faPersonSnowboarding } from '@fortawesome/free-solid-svg-icons/faPersonSnowboarding';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import styled, { useTheme } from 'styled-components';

const Purchased: React.FC<React.PropsWithChildren<unknown>> = () => {
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
									icon={faPersonSnowboarding}
									size={'2x'}
								/>
							</CardIcons>
							<CardTitle>
								{'Getting started'}
							</CardTitle>
							<CardBody>
								{'Welcome to Beak! To get started, just head to the '}
								<Link href={'/#downloads'}>{'downloads'}</Link>{' page '}
								{'to download Beak for your device. Updates will of '}
								{'course be automatically downloaded in future.'}
							</CardBody>
						</Card>
						<Card>
							<CardIcons>
								<FontAwesomeIcon
									color={theme.ui.primaryFill}
									icon={faHatWizard}
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
									href={'https://getbeak.notion.site/User-accounts-licences-d2e61bede483466fbe32d8a841a860b4'}
								>
									{'article'}
								</a>{'.'}
							</CardBody>
						</Card>
						<Card>
							<CardIcons>
								<FontAwesomeIcon
									color={theme.ui.primaryFill}
									icon={faBookOpen}
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
									href={'https://getbeak.notion.site/Beak-manual-8c908d9584f34b8db19267dcc6206e9e'}
								>
									{'over here'}
								</a>
								{'. And of course there is the feature overview available on our '}
								<Link href={'/#features'}>{'home page'}</Link>{'.'}
							</CardBody>
						</Card>
						<Card>
							<CardIcons>
								<FontAwesomeIcon
									color={theme.ui.primaryFill}
									icon={faLifeRing}
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
