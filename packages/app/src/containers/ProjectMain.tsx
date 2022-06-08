import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch } from 'react-redux';
import { ReflexContainer } from 'react-reflex';
import { useAppSelector } from '@beak/app/store/redux';
import styled from 'styled-components';

import ReflexElement from '../components/atoms/ReflexElement';
import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ReflexStyles from '../components/atoms/ReflexStyles';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import ProjectLoading from '../components/molecules/ProjectLoading';
import ActionBar from '../features/action-bar/components/ActionBar';
import ProjectEncryption from '../features/encryption/components/ProjectEncryption';
import Omnibar from '../features/omni-bar/components/Omnibar';
import Sidebar from '../features/sidebar/components/Sidebar';
import TabView from '../features/tabs/components/TabView';
import { useApplicationMenuEventListener } from '../hooks/use-application-menu-event-listener';
import { checkShortcut } from '../lib/keyboard-shortcuts';
import { startExtensions } from '../store/extensions/actions';
import { requestFlight } from '../store/flight/actions';
import { startGit } from '../store/git/actions';
import { loadEditorPreferences, loadProjectPanePreferences, loadSidebarPreferences } from '../store/preferences/actions';
import { revealRequestExternal, startProject } from '../store/project/actions';

const ProjectMain: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();
	const [title, setTitle] = useState('Loading... - Beak');
	const [setup, setSetup] = useState(false);
	const collapsedSidebar = useAppSelector(s => s.global.preferences.sidebar.collapsed.sidebar);
	const project = useAppSelector(s => s.global.project);
	const variableGroups = useAppSelector(s => s.global.variableGroups);
	const tabs = useAppSelector(s => s.features.tabs);
	const activeTab = tabs.activeTabs.find(t => t.payload === tabs.selectedTab);

	const loaded = project.loaded && variableGroups.loaded && tabs.loaded;

	useApplicationMenuEventListener();

	useEffect(() => {
		dispatch(loadEditorPreferences());
		dispatch(loadSidebarPreferences());
		dispatch(loadProjectPanePreferences());
		dispatch(startProject());
		dispatch(startExtensions());
		dispatch(startGit());

		window.secureBridge.ipc.on('reveal_request', (_event, payload) => {
			const typed = payload as { requestId: string };

			dispatch(revealRequestExternal(typed.requestId));
		});
	}, []);

	useEffect(() => {
		if (!loaded || !setup)
			return;

		window.addEventListener('keydown', event => {
			switch (true) {
				case checkShortcut('global.execute-request', event):
					event.stopPropagation();
					dispatch(requestFlight());

					break;

				default:
					return;
			}

			event.preventDefault();
		});
	}, [loaded, setup]);

	useEffect(() => {
		if (!loaded || setup)
			return;

		window.setTimeout(() => setSetup(true), 300);

		setTitle(`${project.name} - Beak`);
	}, [setup, project, project.name, loaded]);

	return (
		<React.Fragment>
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
								flex={15}
								minSize={250}
								$forcedWidth={collapsedSidebar ? 42 : void 0}
							>
								<Sidebar />
							</ReflexElement>

							<ReflexSplitter
								$disabled={collapsedSidebar}
								hideVisualIndicator
								orientation={'vertical'}
							/>

							<ReflexElement
								flex={80}
								minSize={902}
								style={{ overflowY: 'hidden' }}
							>
								<ActionBar />
								<TabView tabs={tabs.activeTabs} selectedTab={activeTab} />
							</ReflexElement>
						</ReflexContainer>
						<Omnibar />
					</React.Fragment>
				)}
			</Container>

			<ProjectEncryption />

			{(!loaded || !setup) && <ProjectLoading />}
		</React.Fragment>
	);
};

const Container = styled.div`
	position: absolute;
	top: 0; bottom: 0; left: 0; right: 0;
`;

export default ProjectMain;
