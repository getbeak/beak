import { SmallContainer } from '@beak/apps-web-share/components/atoms/Container';
import * as React from 'react';
import Helmet from 'react-helmet';

import InfoCard from './molecules/InfoCard';

const ShareProject: React.FC = () => (
	<SmallContainer mt='25'>
		<Helmet defer={false}>
			<title>{'Beak :: Someone has shared a project with you'}</title>
		</Helmet>
		<InfoCard />
	</SmallContainer>
);

export default ShareProject;
