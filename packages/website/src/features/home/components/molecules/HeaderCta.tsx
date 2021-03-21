import CtaButton from '@beak/website/src/components/atoms/Buttons';
import React from 'react';
import styled from 'styled-components';

const beta = true;

const HeaderCta: React.FunctionComponent = () => (
	<Wrapper>
		{beta && <CtaButton href={'#downloads'}>{'Download the beta'}</CtaButton>}
		{!beta && (
			<React.Fragment>
				<CtaButton href={'#stripe'}>{'Buy Beak for $19'}</CtaButton>
				<CtaButton href={'#downloads'}>{'Download the free trial'}</CtaButton>
			</React.Fragment>
		)}
	</Wrapper>
);

const Wrapper = styled.div`
	margin-top: 40px;
	margin-bottom: 15px;

	display: flex;
	flex-direction: row;
	justify-content: center;

	@media (max-width: 676px) {
		flex-direction: column;

		/* > ${CtaButton}:first-child {
			margin-bottom: 10px;
		} */
	}
`;

export default HeaderCta;
