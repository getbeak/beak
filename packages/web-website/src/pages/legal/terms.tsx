import * as React from 'react';
import { HeadFC, PageProps } from 'gatsby';

import AppContainer from '../../containers/AppContainer';
import LegalTerms from '../../features/legal/components/Terms';

const LegalTermsPage: React.FC<PageProps> = () => (
	<AppContainer>
		<LegalTerms />
	</AppContainer>
);

export default LegalTermsPage;

export const Head: HeadFC = () => <title>{'Terms :: Beak'}</title>;
