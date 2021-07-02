import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDispatch, useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ReflexStyles from '../components/atoms/ReflexStyles';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import BeakHubContext from '../contexts/beak-hub-context';
import BeakUserPreferencesContext from '../contexts/beak-user-preferences-context';
import ActionBar from '../features/action-bar/components/ActionBar';
import Omnibar from '../features/omni-bar/components/Omnibar';
import ProjectPane from '../features/project-pane/components/ProjectPane';
import StatusBar from '../features/status-bar/components/StatusBar';
import TabView from '../features/tabs/components/TabView';
import { isDarwin } from '../globals';
import useTitleBar from '../hooks/use-title-bar';
import BeakHub from '../lib/beak-hub';
import BeakUserPreferences from '../lib/beak-hub/user-preferences';
import { ipcFsService } from '../lib/ipc';
import { requestFlight } from '../store/flight/actions';
import { populateTabs, startProject, tabSelected } from '../store/project/actions';

const ProjectMain: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const [title, setTitle] = useState('Loading... - Beak');
	const [setup, setSetup] = useState(false);
	const params = new URLSearchParams(window.location.search);
	const projectFilePath = decodeURIComponent(params.get('projectFilePath') as string);
	const project = useSelector(s => s.global.project);
	const variableGroups = useSelector(s => s.global.variableGroups);
	const { selectedTabPayload, tabs } = useSelector(s => s.global.project);
	const selectedTab = tabs.find(t => t.payload === selectedTabPayload);

	const hub = useRef<BeakHub | null>(null);
	const loaded = project.loaded && variableGroups.loaded;

	useEffect(() => {
		ipcFsService.setProjectFilePath(projectFilePath);
		dispatch(startProject(projectFilePath));
	}, [projectFilePath]);

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown);

		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	useEffect(() => {
		if (!loaded || setup)
			return;

		hub.current = new BeakHub(project.projectPath!);

		const instance = BeakUserPreferences.setupInstance(hub.current);

		instance.load()
			.then(() => {
				const { tabs, selectedTabPayload } = instance!.getPreferences();

				dispatch(populateTabs(tabs));

				if (tabs.length !== 0 && selectedTabPayload) {
					const selectedTab = tabs.find(t => t.payload === selectedTabPayload);

					if (selectedTab)
						dispatch(tabSelected(selectedTab));
				}

				setSetup(true);
			});

		setTitle(`${project.name} - Beak`);
	}, [setup, project, project.name, loaded]);

	function onKeyDown(event: KeyboardEvent) {
		if (!selectedTab || event.key !== 'Return')
			return;

		const isAct = (isDarwin() && event.metaKey) || (!isDarwin() && event.ctrlKey);

		if (isAct)
			dispatch(requestFlight());
	}

	useHotkeys('command+enter,ctrl+enter', () => {
		if (selectedTab?.type !== 'request')
			return;

		dispatch(requestFlight());
	}, [tabs, selectedTab]);

	useTitleBar();

	return (
		<React.Fragment>
			<BeakHubContext.Provider value={hub.current!}>
				<BeakUserPreferencesContext.Provider value={BeakUserPreferences.getInstance()}>
					<Helmet defer={false}>
						<title>{title}</title>
					</Helmet>
					<ProgressIndicator />
					<Container>
						<ReflexStyles />
						{setup && loaded && (
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

										<TabView tabs={tabs} selectedTab={selectedTab} />
									</ReflexElement>
								</ReflexContainer>
								<Omnibar />
							</React.Fragment>
						)}
					</Container>
					<StatusBar />
					{(!loaded || !setup) && <LoadingMask />}
				</BeakUserPreferencesContext.Provider>
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
