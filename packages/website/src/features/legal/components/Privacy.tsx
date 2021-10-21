import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import React from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import { LastUpdated } from './atoms/LegalTypograpgy';
import { LegalTitle } from './molecules/LegalTitle';

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
