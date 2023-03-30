import * as React from 'react';
import { HeadFC, PageProps } from 'gatsby';

import AppContainer from '../containers/AppContainer';
import NotFound from '../features/errors/components/NotFound';

const NotFoundPage: React.FC<PageProps> = () => (
	<AppContainer>
		<NotFound />
	</AppContainer>
);

export default NotFoundPage;

export const Head: HeadFC = () => <title>{'Beak :: Page not found, or misplaced'}</title>;
