import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import React from 'react';
import Helmet from 'react-helmet';
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

			<LegalTitle id={'whomst'}>
				{'1. Who we are'}
			</LegalTitle>

			<LegalTitle id={'personal-data'}>
				{'2. Your personal data'}
			</LegalTitle>

			<LegalTitle id={'information-collection'}>
				{'3. Other information we collect'}
			</LegalTitle>

			<LegalTitle id={'sharing-isnt-caring'}>
				{'4. Sharing data with other parties'}
			</LegalTitle>

			<LegalTitle id={'where-info-goes'}>
				{'5. Where your information goes'}
			</LegalTitle>

			<LegalTitle id={'your-rights'}>
				{'6. Your rights and controlling your personal information'}
			</LegalTitle>

			<LegalTitle id={'changes'}>
				{'7. Changes to our policy'}
			</LegalTitle>

			<LegalTlDr>
				{'tl;dr we ethical babes'}
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
