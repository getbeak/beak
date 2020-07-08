import React from 'react';
import { Col } from 'react-grid-system';

import { WelcomeViewType } from '../../../../containers/Welcome';
import WelcomeColumnTitle from '../atoms/WelcomeColumnTitle';
import GetStartedButton from '../molecules/GetStartedButton';

export interface GetStartedColumnProps {
	setView: (view: WelcomeViewType) => void;
}

const GetStartedColumn: React.FunctionComponent<GetStartedColumnProps> = ({ setView }) => (
	<Col>
		<WelcomeColumnTitle>{'Get started'}</WelcomeColumnTitle>

		<GetStartedButton
			title={'Create a new project'}
			description={'Creates a new local project'}
			onClick={() => setView('create-local')}
		/>

		<GetStartedButton
			title={'Open an existing project'}
			description={'Opens an existing local project'}
		/>

		<GetStartedButton
			disabled
			title={'Create a team project'}
			description={'Creates a new cloud-based team project'}
		/>
	</Col>
);

export default GetStartedColumn;
