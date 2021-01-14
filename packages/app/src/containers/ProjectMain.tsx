import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDispatch, useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ReflexStyles from '../components/atoms/ReflexStyles';
import TB from '../components/atoms/TabBar';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import ProjectTab from '../components/molecules/ProjectTab';
import BeakHubContext from '../contexts/beak-hub-context';
import ActionBar from '../features/action-bar/components/ActionBar';
import Omnibar from '../features/omni-bar/components/Omnibar';
import ProjectPane from '../features/project-pane/components/ProjectPane';
import RequestPane from '../features/request-pane/components/RequestPane';
import ResponsePane from '../features/response-pane/components/ResponsePane';
import StatusBar from '../features/status-bar/components/StatusBar';
import { isDarwin } from '../globals';
import useTitleBar from '../hooks/use-title-bar';
import BeakHub from '../lib/beak-hub';
import { requestFlight } from '../store/flight/actions';
import { startProject } from '../store/project/actions';

const ProjectMain: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const [title, setTitle] = useState('Loading... - Beak');
	const params = new URLSearchParams(window.location.search);
	const projectFilePath = decodeURIComponent(params.get('projectFilePath') as string);
	const project = useSelector(s => s.global.project);
	const variableGroups = useSelector(s => s.global.variableGroups);
	const { selectedRequest, selectedRequests } = useSelector(s => s.global.project);

	const [hub, setHub] = useState<BeakHub | null>(null);
	const loaded = project.loaded && variableGroups.loaded;

	useEffect(() => {
		dispatch(startProject(projectFilePath));
	}, [projectFilePath]);

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown);

		return function remove() {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, []);

	useEffect(() => {
		if (!loaded)
			return;

		setHub(new BeakHub(project.projectPath!));
		setTitle(`${project.name} - Beak`);
	}, [project, project.name, loaded]);

	function onKeyDown(event: KeyboardEvent) {
		if (!selectedRequest || event.key !== 'Return')
			return;

		const isAct = (isDarwin() && event.metaKey) || (!isDarwin() && event.ctrlKey);

		if (isAct)
			dispatch(requestFlight());
	}

	useHotkeys('command+enter,ctrl+enter', () => {
		if (!selectedRequest)
			return;

		dispatch(requestFlight());
	}, [selectedRequest]);

	useTitleBar();

	return (
		<React.Fragment>
			<BeakHubContext.Provider value={hub}>
				<Helmet defer={false}>
					<title>{title}</title>
				</Helmet>
				<ProgressIndicator />
				<Container>
					<ReflexStyles />
					{loaded && (
						<React.Fragment>
							<ReflexContainer orientation={'vertical'}>
								<ReflexElement
									flex={20}
									minSize={200}
								>
									<ProjectPane />
								</ReflexElement>

								<ReflexSplitter
									hideVisualIndicator
									orientation={'vertical'}
								/>

								<ReflexElement
									flex={80}
									style={{ overflowY: 'hidden' }}
								>
									<ActionBar />

									<TabBar>
										{selectedRequests.map(id => (
											<ProjectTab
												nodeId={id}
												selectedRequestId={selectedRequest}
												key={id}
											/>
										))}
									</TabBar>

									<ReqResContainer orientation={'vertical'}>
										<ReflexElement
											flex={50}
											minSize={450}
										>
											<RequestPane />
										</ReflexElement>

										<ReflexSplitter orientation={'vertical'} />

										<ReflexElement
											flex={50}
											minSize={450}
										>
											<ResponsePane />
										</ReflexElement>
									</ReqResContainer>
								</ReflexElement>
							</ReflexContainer>
							<Omnibar />
						</React.Fragment>
					)}
				</Container>
				<StatusBar />
				{!loaded && <LoadingMask />}
			</BeakHubContext.Provider>
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

const TabBar = styled(TB)`
	background-color: ${props => props.theme.ui.secondarySurface};
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

const ReqResContainer = styled(ReflexContainer)`
	height: calc(100% - 34px);
`;

export default ProjectMain;
