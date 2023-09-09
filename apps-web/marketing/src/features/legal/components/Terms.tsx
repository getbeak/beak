import React from 'react';
import Helmet from 'react-helmet';
import { SmallContainer } from '@beak/apps-web-marketing/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/apps-web-marketing/components/atoms/Typography';
import Link from 'next/link';
import styled from 'styled-components';

import { LastUpdated, LegalTlDr } from './atoms/LegalTypograpgy';
import { LegalSubTitle, LegalTitle } from './molecules/LegalTitle';

const Terms: React.FC<React.PropsWithChildren<unknown>> = () => (
	<React.Fragment>
		<Helmet defer={false}>
			<title>{'Terms :: Beak'}</title>
		</Helmet>
		<Header>
			<SmallContainer>
				<TitleSubtle>{'Legal'}</TitleSubtle>
				<Title>{'Terms'}</Title>
				<SubTitle>{'You know you want to read them...'}</SubTitle>
			</SmallContainer>
		</Header>
		<SmallContainer>
			<LastUpdated>
				{'Last updated: '}
				<b>
					{'November 03, 2021'}
				</b>
			</LastUpdated>

			<a
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://github.com/getbeak/beak/commits/master/packages/website/src/features/legal/components/Terms.tsx'}
			>
				{'View history'}
			</a>

			<p>
				{'Please read these terms of service ("terms", "they") carefully before you embark on your Beak '}
				{'journey (start using Beak ("app", "desktop app", "the service")). They should explain who we are, '}
				{'how we operate, how they might change, and what to do if there is a problem and you need to contact '}
				{'us.'}
			</p>

			<LegalTitle id={'general'}>
				{'1. General'}
			</LegalTitle>
			<p>
				{'These Terms of Service are provided by Flamingo Corp Limited ("Flamingo Corp", "we", "our", "us"), '}
				{'a limited liability company incorporated in England, and we are registered at Oakley House, 103 '}
				{'Sloane Street, London, SW1X 9PP. They are an agreement between the Licensee ("you", "your") and us. '}
			</p>
			<p>
				{'You agree that these terms will be legally binding when you use this website or sign into Beak. If '}
				{'you do not agree to them please stop using this site or Beak immediately.'}
			</p>
			<p>
				{'We hold the right to modify these terms at any time without notice. However if we make material '}
				{'updates, we will inform you by email. However by using this web site you are agreeing to be bound '}
				{'by the current version of these Terms of Service.'}
			</p>

			<LegalTitle id={'licenses'}>
				{'2. Software licenses'}
			</LegalTitle>
			<p>
				{'Flamingo Corp may, at its sole discretion, grant you either a Beta license (subscription), a '}
				{'commercial license, or a Trial license. The Beta license terms are applicable if you are '}
				{'participating in any of the active Beak Beta programmes. The Trial license terms are only '}
				{'applicable if you have subscribed to a Trial version of the Beak Subscription.'}
			</p>

			<LegalSubTitle id={'commercial-license'}>
				{'a. Commercial license'}
			</LegalSubTitle>
			<p>
				{'Flamingo Corp grants you a non-exclusive, non-transferable license to use Beak, only in accordance '}
				{'with the terms of service set from here on out. You agree not to transfer, assign, rent, lease, or '}
				{'otherwise lend Beak to any other person or entity (legal or not), and accept that any attempt to do '}
				{'so in any way will result in your license becoming null and void.'}
			</p>
			<p>
				{'Beak subscriptions are on a per-user basis. Purchase of a commercial license grants you the right '}
				{'use Beak on multiple machines, within reasonable limits, that are owned and used by you. We may '}
				{'define and adjust these limits at any time.'}
			</p>

			<LegalSubTitle id={'beta-license'}>
				{'b. Beta license'}
			</LegalSubTitle>
			<p>
				{'Flamingo Corp grants you a non-exclusive, non-transferable license to use Beak for the duration of '}
				{'that specific Beta program only, and only in accordance with the terms of service set from here '}
				{'on out. You agree not to transfer, assign, rent, lease, or otherwise lend Beak to any other person '}
				{'or entity (legal or not), and accept that any attempt to do so in any way will result in your '}
				{'license becoming null and void.'}
			</p>
			<p>
				{'Beak may be used for the duration of the Beta program. Upon lapse of such a Beta program, all of '}
				{'the functionality of the Beak application will be disabled automatically. We may, at our sole '}
				{'discretion end or extend the Beta program, and will inform you via the email address provided upon '}
				{'registration. If you wish to continue using Beak after the Beta program has ended, you may do so by '}
				{'either using your existing, or purchasing a new, commercial license.'}
			</p>

			<LegalSubTitle id={'trial-license'}>
				{'b. Trial license'}
			</LegalSubTitle>
			<p>
				{'Flamingo Corp grants you a non-exclusive, non-transferable license to use Beak on a time limited '}
				{'period, and only in accordance with the terms of service set from here on out. You agree not to '}
				{'transfer, assign, rent, lease, or otherwise lend Beak to any other person or entity (legal or not), '}
				{'and accept that any attempt to do so in any way will result in your license becoming null and void. '}
				{'Beak may be used in full for the period of 14 calendar days from the time you start your trial '}
				{'period. Upon lapsing of the trial period all Beak functionality will automatically be disabled.'}
			</p>
			<p>
				{'Flamingo Corp may, at any time, extend the duration of the trial period. In such an event, we shall '}
				{'inform you via email. If you wish to continue using Beak after the trial period has elapsed, you '}
				{'will have to purchase a commercial license.'}
			</p>

			<LegalTitle id={'subs-pays-refs'}>
				{'3. Subscriptions, payments, and refunds'}
			</LegalTitle>
			<LegalSubTitle id={'pricing'}>
				{'a. Pricing'}
			</LegalSubTitle>
			<p>
				{'Unless you are using the Beta or Trial license of Beak, access to Beak requires the purchase of a '}
				{'subscription. Our pricing and subscription information, and limits are available at '}
				<Link href={'/pricing'}>{`https://${window.location.hostname}.app/pricing`}</Link>{'.'}
			</p>
			<p>
				{'If you purchase a subscription, the price will remain constant until the end of the selected '}
				{'subscription term. However, if we change pricing during the subscription term, the new price '}
				{'will be used for the next payment term.'}
			</p>

			<LegalSubTitle id={'payment-terms'}>
				{'b. Payment and recurring payments'}
			</LegalSubTitle>
			<p>
				{'If you purchase a subscription, you will be charged the then-current rate immediately, and then '}
				{'each year thereafter. Subscription pricing is detailed on our pricing page '}
				<Link href={'/pricing'}>{`https://${window.location.hostname}.app/pricing`}</Link>{'. '}
			</p>
			<p>
				{'By agreeing to these terms and purchasing a subscription, you acknowledge that your subscription '}
				{'payments will recur based on the payment terms you accepted. Our payment processor will '}
				{'automatically charge you in accordance with the term of your subscription (ie; each year).'}
			</p>

			<LegalSubTitle id={'cancel-refund'}>
				{'c. Cancellations and refunds'}
			</LegalSubTitle>
			<p>
				{'You may cancel your subscription at any time, but please note that you will not receive a refund '}
				{'unless via the terms mentioned above. The cancellation will come into effect at the end of the '}
				{'current payment term. To cancel you can either access your Stripe billing portal from the '}
				{'Subscription section of the Beak preferences window, or via email '}
				<a href={'mailto:support@getbeak.app'}>{'support@getbeak.app'}</a>{'.'}
			</p>

			<p>
				{'If you are unhappy with Beak, you are entitled to a full refund if requested within 7 days of '}
				{'purchasing your Subscription.'}
			</p>

			<LegalTitle id={'software-provided'}>
				{'4. Software Provided "As Is"'}
			</LegalTitle>
			<p>
				{'Except as represented in this agreement, this service is provided ​"as is". Other than as provided '}
				{'in this agreement, we makes no other warranties, express or implied, and hereby disclaims all '}
				{'implied warranties, including any warranty of merchantability and warranty of fitness for a '}
				{'particular purpose.'}
			</p>
			<p>
				{'You may reach out and ask questions about the software via Email. We do not guarantee the '}
				{'continuous, uninterrupted and error-free usage of the service.'}
			</p>

			<LegalTitle id={'copyright'}>
				{'5. Copyright'}
			</LegalTitle>
			<p>
				{'Unless otherwise stated, we remain the sole owner of this Software, source code, database, '}
				{'functionality, website designs, structure, and graphics provided on this site or inside the Beak '}
				{'application. You agree not to reverse engineer, decompile, or disassemble the bundled Software.'}
			</p>

			<LegalTitle id={'authentication'}>
				{'6. Authentication'}
			</LegalTitle>
			<p>
				{'Please keep your email security details safe and secure. Inform us immediately if you think someone '}
				{'may have accessed your Beak account using them.'}
			</p>
			<p>
				{'If someone gains access to your Beak account using your credentials, and modifies your Subscription '}
				{'in any way, Flamingo will not be obligated to refund or amend the changes made.'}
			</p>

			<LegalTitle id={'privacy'}>
				{'7. Privacy'}
			</LegalTitle>
			<p>
				{'You can view our full Privacy Policy ("notice") by visiting '}
				<Link href={'/legal/privacy'}>{`${window.location.hostname}.app/legal/privacy`}</Link>
				{'.'}
			</p>

			<LegalTitle id={'law-and-jurisdiction'}>
				{'8. Law and jurisdiction'}
			</LegalTitle>
			<p>
				{'The laws of England and Wales apply to our service. Anu disputes are intended to be heard by the '}
				{'Courts of England and Wales. However we do recognise you\'re free to choose the laws and '}
				{'jurisdiction of Scotland, or Northern Ireland, if you\'re a resident there and wish to do so.'}
			</p>

			<LegalTlDr>
				{'tl;dr pls don\'t sue'}
			</LegalTlDr>
		</SmallContainer>
	</React.Fragment>
);

export default Terms;

const Header = styled.div`
	padding-top: 80px;
	padding-bottom: 80px;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;
