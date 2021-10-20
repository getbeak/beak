import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import React from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import { LastUpdated, LegalParagraph } from './atoms/LegalTypograpgy';
import LegalTitle from './molecules/LegalTitle';

const Privacy: React.FunctionComponent = () => (
	<React.Fragment>
		<Helmet defer={false}>
			<title>{'Privacy :: Beak'}</title>
		</Helmet>
		<Header>
			<SmallContainer>
				<TitleSubtle>{'Legal'}</TitleSubtle>
				<Title>{'Privacy'}</Title>
				<SubTitle>{'You know you should read them'}</SubTitle>
			</SmallContainer>
		</Header>
		<SmallContainer>
			<LastUpdated>
				{'Last updated: '}
				<b>
					{'October 20, 2021'}
				</b>
			</LastUpdated>

			<a
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://github.com/getbeak/beak/commits/master/packages/website/src/features/legal/components/Privacy.tsx'}
			>
				{'View history'}
			</a>

			<LegalTitle id={'introduction'}>
				{'1. Introduction'}
			</LegalTitle>
			<LegalParagraph>
				{'These User Terms of Service ("Terms") are between you ("you") and Beak ("Beak" or "we"). By accessing '}
				{'Beak\'s website, as well as any other media form, media channel, or desktop or browser based '}
				{'application related or otherwise connected thereto (the "Site"), you are agreeing to be bound by '}
				{'these terms of service, all applicable laws and regulations, and agree that you are responsible for '}
				{'compliance with any applicable local laws. If you do not agree with any of these terms, you are '}
				{'prohibited from using or accessing this site, media form, media channel, or desktop or browser based '}
				{'application. The materials contained in this website are protected by applicable copyright and '}
				{'trademark law.'}
			</LegalParagraph>

			<LegalTitle id={'binding-agreement'}>
				{'2. Binding agreement'}
			</LegalTitle>
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
