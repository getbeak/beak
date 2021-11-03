import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import React from 'react';
import Helmet from 'react-helmet';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { LastUpdated, LegalTlDr } from './atoms/LegalTypograpgy';
import { LegalSubTitle, LegalTitle } from './molecules/LegalTitle';

const Terms: React.FunctionComponent = () => (
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
				{'Flamingo Corp may, at its sole discretion, grant you either a Beta license (subscription) or a '}
				{'commercial license. The Beta license terms are applicable if you are participating in any of the '}
				{'active Beak Beta programmes.'}
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

			<LegalTitle id={'subs-pays-refs'}>
				{'3. Subscriptions, payments, and refunds'}
			</LegalTitle>
			<p>

			</p>

			<LegalTitle id={'software-provided'}>
				{'4. Software Provided "As Is"'}
			</LegalTitle>

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
				<Link to={'/legal/privacy'}>{`${window.location.hostname}.app/legal/privacy`}</Link>
				{'.'}
			</p>

			<LegalTitle id={'law-and-jurisdiction'}>
				{'8. Law and jurisdiction'}
			</LegalTitle>
			<p>
				{'The laws of England and Wales apply to our service. Anu disputes are intended to be heard by the '}
				{`Courts of England and Wales. However we do recognise you're free to choose the laws and `}
				{`jurisdiction of Scotland, or Northern Ireland, if you're a resident there and wish to do so.`}
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
