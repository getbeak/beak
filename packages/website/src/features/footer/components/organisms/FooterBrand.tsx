import React from 'react';
import FooterLogo from '@beak/website/components/atoms/FooterLogo';
import styled from 'styled-components';

const FooterBrand: React.FunctionComponent = () => (
	<div>
		<FooterLogo />
		<Text>{'© 2021 Flamingo Corp Ltd.'}</Text>
		<Text>{'Made with ❤️ in the UK'}</Text>
	</div>
);

const Text = styled.div`
	font-size: 14px;
	color: ${p => p.theme.ui.textMinor};
`;

export default FooterBrand;
