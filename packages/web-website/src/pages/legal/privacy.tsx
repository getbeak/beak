import * as React from 'react';
import { HeadFC, PageProps } from 'gatsby';

import AppContainer from '../../containers/AppContainer';
import LegalPrivacy from '../../features/legal/components/Privacy';

const LegalPrivacyPage: React.FC<PageProps> = () => (
	<AppContainer>
		<LegalPrivacy />
	</AppContainer>
);

export default LegalPrivacyPage;

export const Head: HeadFC = () => <title>{'Privacy policy :: Beak'}</title>;
