import React from 'react';
import { Col } from 'react-grid-system';
import styled from 'styled-components';

import GetStartedButton from '../molecules/GetStartedButton';

const GetStartedColumn: React.FunctionComponent = () => (
	<Col>
		<Title>{'Get started'}</Title>

		<GetStartedButton
			title={'Create a new project'}
			description={'Creates a new local project'}
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

const Title = styled.div`
	margin-bottom: 20px;
`;

export default GetStartedColumn;
