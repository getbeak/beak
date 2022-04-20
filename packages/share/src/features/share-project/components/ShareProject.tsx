import React from 'react';
import Helmet from 'react-helmet';
import { SmallContainer } from '@beak/share/components/atoms/Container';
import styled from 'styled-components';

import InfoCard from './molecules/InfoCard';

const ShareProject: React.FunctionComponent = () => (
	<SpacedContainer>
		<Helmet defer={false}>
			<title>{'Beak :: Someone has shared a project with you'}</title>
		</Helmet>
		<InfoCard />
	</SpacedContainer>
);

const SpacedContainer = styled(SmallContainer)`
	margin-top: 100px;
`;

export default ShareProject;
