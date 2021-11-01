import React from 'react';
import styled from 'styled-components';

import CtaButton from '../../../../components/atoms/Buttons';

const HeaderCta: React.FunctionComponent = () => (
	<Wrapper>
		<CtaButton href={'/pricing'} $style={'primary'}>{'View pricing'}</CtaButton>
		<CtaButton href={'/#downloads'} $style={'secondary'}>{'Download'}</CtaButton>
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

		> ${CtaButton}:first-child {
			margin-bottom: 10px;
		}
	}
`;

export default HeaderCta;
