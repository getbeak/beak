import React from 'react';
import styled from 'styled-components';

import { SmallContainer } from '../../../components/atoms/Container';
import FooterBrand from './organisms/FooterBrand';
import FooterLinks from './organisms/FooterLinks';

const Footer: React.FC<React.PropsWithChildren<unknown>> = () => (
	<FooterWrapper>
		<FooterContainer>
			<FooterBrand />
			<FooterLinks />
		</FooterContainer>
	</FooterWrapper>
);

const FooterWrapper = styled.footer`
	margin-top: 120px;
	background: ${p => p.theme.ui.background};
`;

const FooterContainer = styled(SmallContainer)`
	display: flex;
	padding: 90px 0;
	justify-content: space-between;

	@media (max-width: 676px) {
		flex-direction: column;
		padding: 50px 0;
	}
`;

export default Footer;
