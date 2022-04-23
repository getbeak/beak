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

const WelcomeView: React.FC<React.PropsWithChildren<WelcomeViewProps>> = ({ setView }) => (
	<Wrapper>
		<ViewTitle>{'Welcome to Beak!'}</ViewTitle>
		<ViewIntroLine>{'The feathery cross-platform API crafting tool'}</ViewIntroLine>

		<Grid>
			<OpenRecentColumn />
			<GetStartedColumn setView={setView} />
		</Grid>
	</Wrapper>
);

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;

	height: 100%;
`;

const Grid = styled.div`
	display: flex;
	height: calc(100% - 89px);
	gap: 20px;
`;

export default WelcomeView;
