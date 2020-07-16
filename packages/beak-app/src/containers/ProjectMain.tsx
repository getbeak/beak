import 'react-reflex/styles.css';

import React from 'react';
import {
	ReflexContainer,
	ReflexElement,
	ReflexSplitter,
} from 'react-reflex';
import styled from 'styled-components';

const ProjectMain: React.FunctionComponent = () => (
	<React.Fragment>
		<Container>
			<ReflexContainer orientation={'vertical'}>
				<ReflexElement
					size={220}
					minSize={170}
				>
					{'Explorer'}
				</ReflexElement>

				<ReflexSplitter />

				<ReflexElement>
					{'Requester'}
				</ReflexElement>

				<ReflexSplitter />

				<ReflexElement>
					{'Inspector'}
				</ReflexElement>
			</ReflexContainer>
		</Container>
		<StatusContainer>
			<StatusBar />
		</StatusContainer>
	</React.Fragment>
);

const StatusBar = styled.div`
	background-color: ${props => props.theme.ui.primaryFill};
	height: 24px;
`;

const Container = styled.div`
	position: absolute;
	top: 0;
	bottom: 24px;
	left: 0;
	right: 0;
`;

const StatusContainer = styled.div`
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
`;

export default ProjectMain;
