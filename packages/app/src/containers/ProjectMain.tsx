import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDispatch, useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ReflexStyles from '../components/atoms/ReflexStyles';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import Omnibar from '../features/omni-bar/components/Omnibar';
import ProjectPane from '../features/project-pane/components/ProjectPane';
import RequestPane from '../features/request-pane/components/RequestPane';
import ResponsePane from '../features/response-pane/components/ResponsePane';
import StatusBar from '../features/status-bar/components/StatusBar';
import { requestFlight } from '../store/flight/actions';
import { openProject } from '../store/project/actions';

const ProjectMain: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const [title, setTitle] = useState('Loading... - Beak');
	const params = new URLSearchParams(window.location.search);
	const projectFilePath = decodeURIComponent(params.get('projectFilePath') as string);
	const project = useSelector(s => s.global.project);
	const selectedRequest = useSelector(s => s.global.project.selectedRequest);

	useEffect(() => {
		dispatch(openProject(projectFilePath));
	}, [projectFilePath]);

	useEffect(() => {
		if (project.opening)
			return;

		setTitle(`${project.name} - Beak`);
	}, [project, project.name]);

	useHotkeys('command+enter,ctrl+enter', () => {
		if (!selectedRequest)
			return;

		dispatch(requestFlight());
	}, [selectedRequest]);

	return (
		<React.Fragment>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<ProgressIndicator />
			<Container>
				<ReflexStyles />
				{!project.opening && (
					<React.Fragment>
						<ReflexContainer orientation={'vertical'}>
							<ReflexElement
								flex={10}
								// size={250}
							>
								<ProjectPane />
							</ReflexElement>

							<ReflexSplitter orientation={'vertical'} />

							<ReflexElement
								flex={35}
								minSize={400}
							>
								<RequestPane />
							</ReflexElement>

							<ReflexSplitter orientation={'vertical'} />

							<ReflexElement
								flex={55}
								minSize={400}
							>
								<ResponsePane />
							</ReflexElement>
						</ReflexContainer>
						<Omnibar />
					</React.Fragment>
				)}
			</Container>
			<StatusBar />
			{project.opening && <LoadingMask />}
		</React.Fragment>
	);
};

const Container = styled.div`
	position: absolute;
	top: 0;
	bottom: 24px;
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
