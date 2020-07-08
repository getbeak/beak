import React from 'react';
import { Row } from 'react-grid-system';

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
		<ViewIntroLine>{'Yet another API client for you to install...'}</ViewIntroLine>

		<Row>
			<OpenRecentColumn />
			<GetStartedColumn setView={setView} />
		</Row>
	</React.Fragment>
);

export default WelcomeView;
