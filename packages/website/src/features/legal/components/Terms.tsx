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
					{'October 20, 2021'}
				</b>
			</LastUpdated>

			<a
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://github.com/getbeak/beak/commits/master/packages/website/src/features/legal/components/Terms.tsx'}
			>
				{'View history'}
			</a>

			<LegalTitle id={'introduction'}>
				{'1. Introduction'}
			</LegalTitle>

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
