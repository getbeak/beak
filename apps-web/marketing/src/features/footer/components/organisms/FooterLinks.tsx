import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';

const FooterLinks: React.FC<React.PropsWithChildren<unknown>> = () => (
	<LinkContainer>
		<LinkColumn>
			<LinkHeader>{'Beak'}</LinkHeader>
			<LinkItem href={'/#features'}>{'Features'}</LinkItem>
			{/* <LinkItem href={'/pricing'}>{'Pricing'}</LinkItem> */}
			<ExternalLinkItem
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://docs.getbeak.app/'}
			>
				{'Docs'}
			</ExternalLinkItem>
			<ExternalLinkItem
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://status.getbeak.app/'}
			>
				{'Status'}
			</ExternalLinkItem>
			{/* <ExternalLinkItem
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://climate.stripe.com/x4snkJ'}
			>
				{'Climate contribution'}
			</ExternalLinkItem> */}
		</LinkColumn>

		<LinkColumn>
			<LinkHeader>{'Legals'}</LinkHeader>
			<LinkItem href={'/legal/terms'}>{'Terms'}</LinkItem>
			<LinkItem href={'/legal/privacy'}>{'Privacy'}</LinkItem>
		</LinkColumn>

		<LinkColumn>
			<LinkHeader>{'Contact'}</LinkHeader>
			<ExternalLinkItem
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'mailto:info@getbeak.app'}
			>
				{'Email'}
			</ExternalLinkItem>
			<ExternalLinkItem
				target={'_blank'}
				rel={'noopener noreferrer nofollow'}
				href={'https://twitter.com/beakapp'}
			>
				{'Twitter'}
			</ExternalLinkItem>
		</LinkColumn>
	</LinkContainer>
);

const LinkContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 50px;

	@media (max-width: 676px) {
		margin-top: 35px;
		gap: 35px;
		grid-template-columns: 1fr;
	}
`;

const LinkColumn = styled.div``;

const LinkHeader = styled.div`
	font-size: 18px;
	font-weight: 600;
	margin-bottom: 10px;
`;

const LinkItem = styled(Link)`
	display: block;
	font-size: 14px;
	line-height: 25px;
	text-decoration: none;
	color: ${p => p.theme.ui.textMinor};

	&:hover {
		text-decoration: underline;
	}
`;

const ExternalLinkItem = styled.a`
	display: block;
	font-size: 14px;
	line-height: 25px;
	text-decoration: none;
	color: ${p => p.theme.ui.textMinor};

	&:hover {
		text-decoration: underline;
	}
`;

export default FooterLinks;
