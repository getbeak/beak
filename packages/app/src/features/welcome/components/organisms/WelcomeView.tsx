import React from 'react';
import styled from 'styled-components';

import { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';
import GetStartedColumn from './GetStartedColumn';
import OpenRecentColumn from './OpenRecentColumn';

export interface WelcomeViewProps {
	setView: (view: WelcomeViewType) => void;
}

const WelcomeView: React.FunctionComponent<WelcomeViewProps> = ({ setView }) => (
	<React.Fragment>
		<ViewTitle>{'Welcome to Beak!'}</ViewTitle>
		<ViewIntroLine>{'The feathery cross-platform API crafting tool'}</ViewIntroLine>

		<Grid>
			<OpenRecentColumn />
			<GetStartedColumn setView={setView} />
		</Grid>
	</React.Fragment>
);

const Grid = styled.div`
	display: grid;

	grid-template-columns: 60% 40%;
`;

export default WelcomeView;
