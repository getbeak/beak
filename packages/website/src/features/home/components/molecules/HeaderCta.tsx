import CtaButton from '@beak/website/src/components/atoms/Buttons';
import React from 'react';
import styled from 'styled-components';

const HeaderCta: React.FunctionComponent = () => (
	<Wrapper>
		<CtaButton href={'#stripe'}>{'Buy Beak for $19'}</CtaButton>
		<CtaButton href={'#downloads'}>{'Download the free trial'}</CtaButton>
	</Wrapper>
);

const Wrapper = styled.div`
	margin: 40px 0;

	display: flex;
	flex-direction: row;
	justify-content: center;

	@media (max-width: 676px) {
		flex-direction: column;

		> ${CtaButton}:first-child {
			margin-bottom: 10px;
		}
	}
`;

export default HeaderCta;
