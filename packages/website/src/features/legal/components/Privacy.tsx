import React from 'react';
import Helmet from 'react-helmet';
import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import styled from 'styled-components';

import { LastUpdated, LegalTlDr } from './atoms/LegalTypograpgy';
import { LegalSubTitle, LegalTitle } from './molecules/LegalTitle';

const Privacy: React.FunctionComponent = () => (
	<React.Fragment>
		<Helmet defer={false}>
			<title>{'Privacy :: Beak'}</title>
		</Helmet>
		<Header>
			<SmallContainer>
				<TitleSubtle>{'Legal'}</TitleSubtle>
				<Title>{'Privacy'}</Title>
				<SubTitle>{'You know you should read them...'}</SubTitle>
			</SmallContainer>
		</Header>
		<SmallContainer>
			<LastUpdated>
				{'Last updated: '}
				<b>
					{'October 31, 2021'}
				</b>
			</LastUpdated>

			<a
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://github.com/getbeak/beak/commits/master/packages/website/src/features/legal/components/Privacy.tsx'}
			>
				{'View history'}
			</a>

			<LegalTitle id={'whomst'}>
				{'1. Who we are'}
			</LegalTitle>
			<p>
				{'We\'re Flamingo Corp Limited (Flamingo Corp, we, our, us). If you have any questions about your '}
				{'data that aren\'t covered by this privacy policy, you can reach out to us at '}
				<a href={'mailto:privacy@getbeak.app'}>{'privacy@getbeak.app'}</a>{', or tweet us publicly/direct '}
				{'message us privately on Twitter '}
				<a href={'https://twitter.com/beakapp'}>{'@beakapp'}</a>{'.'}
			</p>

			<LegalTitle id={'information-collection'}>
				{'2. What information we collect'}
			</LegalTitle>
			<p>
				{'To use Beak, we may ask for some personal information, such as Name or email address in order to '}
				{'identify your account. We use various third-party services to run and manage Beak\'s infrastructure. '}
				{'Below is a detailed breakdown of which third parties we use, and what each one stores.'}
			</p>
			<LegalSubTitle id={'third-parties'}>
				{'a. Third parties'}
			</LegalSubTitle>
			<p>
				<strong>
					<a
						target={'_blank'}
						href={'https://stripe.com/'}
						rel={'noopener noreferrer nofollow'}
					>{'Stripe'}</a>
				</strong>
				<br />
				{'We use Stripe to manage payments. None of your payment information is ever stored on our servers.'}
			</p>
			<p>
				<strong>
					<a
						target={'_blank'}
						href={'https://aws.amazon.com/'}
						rel={'noopener noreferrer nofollow'}
					>{'AWS'}</a>
				</strong>
				<br />
				{'Beak\'s application infrastructure is all hosted with AWS.'}
			</p>
			<p>
				<strong>
					<a
						target={'_blank'}
						href={'https://www.mongodb.com/'}
						rel={'noopener noreferrer nofollow'}
					>{'MongoDB'}</a>
				</strong>
				<br />
				{'Information about your Beak account, such as email address, subscription information, etc. is all '}
				{'stored securely inside MongoDB Cloud.'}
			</p>
			<p>
				<strong>
					<a
						target={'_blank'}
						href={'https://sentry.io/'}
						rel={'noopener noreferrer nofollow'}
					>{'Sentry'}</a>
				</strong>
				<br />
				{'We use Sentry for desktop and web application error reporting. When an error is detected we may '}
				{'gather information about your connection (such IP address), and information about your device ('}
				{'such as OS version, and other device metadata).'}
			</p>

			<LegalTitle id={'where-info-goes'}>
				{'3. Where your information goes'}
			</LegalTitle>
			<p>
				{'The data we collect from you is stored inside the European Economic Area (EEA). This data may '}
				{'however be accessed and processed by staff members outside the EEA.'}
			</p>
			<p>
				{'Third parties that we send your data too are legally obliged to comply with data protection laws. '}
				{'When we send your data outside of the EEA, we will ensure that it will be protected by appropriate '}
				{'safeguards, for example by using standard data protection clauses approved by the European '}
				{'Commission, or the use of binding corporate rules or other legally accepted means.'}
			</p>

			<LegalTitle id={'your-rights'}>
				{'4. Your data rights'}
			</LegalTitle>
			<LegalSubTitle id={'right-to-erasure'}>
				{'a. Right to erasure'}
			</LegalSubTitle>
			<p>
				{'If you\'d like us to delete your data, you can just let us know by contacting us by email or '}
				{'Twitter.'}
			</p>
			<p>
				{'If you have purchased a subscription from us, we may have to keep some of your payment history '}
				{'(this does not include card details) to protect ourselves from disputes.'}
			</p>

			<LegalSubTitle id={'right-to-rectification'}>
				{'b. Right to rectification'}
			</LegalSubTitle>
			<p>
				{'If you have noticed that data you have given us is incorrect you may sign in to Beak and change it '}
				{'yourself via the preferences section. If you are unable to do that, you may contact us by email '}
				{'and we can change it for you. We may require some form of verification in this scenario.'}
			</p>

			<LegalSubTitle id={'right-to-portability'}>
				{'c. Right to portability'}
			</LegalSubTitle>
			<p>
				{'You have the right to request a copy of all the data that we hold on you. We shall provide this '}
				{'in the JSON file format, with any assets (such as PDF\'s, or images in their original format). '}
				{'While this is free, we may sometimes charge a fee for this, such as in the instance of making '}
				{'repeated requests for information.'}
			</p>

			<LegalTitle id={'changes'}>
				{'5. Changes to our policy'}
			</LegalTitle>
			<p>
				{'We reserve the right to change our privacy policy at any time to reflect our current practices. We '}
				{'will notify you when we make updates either by email or a notification in the app. Continued use of '}
				{'Beak or this website after an update will be regarded as acceptance of the updated policy.'}
			</p>

			<LegalTlDr>
				<SilentAnchor
					target={'_target'}
					rel={'noopener noreferrer nofollow'}
					href={'https://www.youtube.com/watch?v=lLqdd16b7vw'}
				>
					{'tl;dr we ethical babes'}
				</SilentAnchor>
			</LegalTlDr>
		</SmallContainer>
	</React.Fragment>
);

export default Privacy;

const Header = styled.div`
	padding-top: 80px;
	padding-bottom: 80px;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;

const SilentAnchor = styled.a`
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	text-decoration: none;

	&:hover, &:active {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
`;
