import React from 'react';

import SiteShell from '../components/SiteShell';
import NotFound from '../features/errors/NotFound';

const NotFoundPage: React.FC = () => (
	<SiteShell>
		<NotFound />
	</SiteShell>
);

export default NotFoundPage;
