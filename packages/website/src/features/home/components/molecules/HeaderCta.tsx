import CtaButton from '@beak/website/src/components/atoms/Buttons';
import React from 'react';
import styled from 'styled-components';

const HeaderCta: React.FunctionComponent = () => (
	<Wrapper>
		<CtaButton href={'#stripe'}>{'Buy Beak for $20'}</CtaButton>
		<CtaButton href={'#downloads'}>{'Download the free trial'}</CtaButton>
	</Wrapper>
);

const Wrapper = styled.div`
	margin: 40px 0;

	display: flex;
	flex-direction: row;
	justify-content: center;

	> ${CtaButton} {
		margin: 0 15px;
	}
`;

export default HeaderCta;
