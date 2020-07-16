import 'react-reflex/styles.css';

import React, { useEffect } from 'react';
import {
	ReflexContainer,
	ReflexElement,
	ReflexSplitter,
} from 'react-reflex';
import styled from 'styled-components';

const ProjectMain: React.FunctionComponent = () => {
	const params = new URLSearchParams(window.location.search);
	const projectFilePath = decodeURIComponent(params.get('projectFilePath') as string);

	useEffect(() => {
		// Dispatch load
		// Wait until all clear event
		// ???
		// PROFIT
	}, [projectFilePath]);

	return (
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
						<br />
						{projectFilePath}
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
			<LoadingMask />
		</React.Fragment>
	);
};

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

const LoadingMask = styled.div`
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;

	background-color: ${props => props.theme.ui.surface};
	opacity: 0.6;

	z-index: 1000;
`;

export default ProjectMain;
