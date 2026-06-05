import React from 'react';

import SiteShell from '../components/SiteShell';
import Home from '../features/home/Home';

const HomePage: React.FC = () => (
	<SiteShell>
		<Home />
	</SiteShell>
);

export default HomePage;
