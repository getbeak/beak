import * as React from 'react';
import { HeadFC, PageProps } from 'gatsby';

import AppContainer from '../containers/AppContainer';
import Purchased from '../features/purchased/components/Purchased';

const PurchasedPage: React.FC<PageProps> = () => (
	<AppContainer>
		<Purchased />
	</AppContainer>
);

export default PurchasedPage;

export const Head: HeadFC = () => <title>{'Beak :: Thank you for purchasing 💖'}</title>;
