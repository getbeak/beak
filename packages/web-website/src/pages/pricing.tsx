import * as React from 'react';
import { HeadFC, PageProps } from 'gatsby';

import AppContainer from '../containers/AppContainer';
import Pricing from '../features/pricing/components/Pricing';

const PricingPage: React.FC<PageProps> = () => (
	<AppContainer>
		<Pricing />
	</AppContainer>
);

export default PricingPage;

export const Head: HeadFC = () => <title>{'Beak :: Pricing'}</title>;
