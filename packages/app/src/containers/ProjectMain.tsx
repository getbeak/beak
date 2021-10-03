import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ReflexStyles from '../components/atoms/ReflexStyles';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import WindowSessionContext from '../contexts/window-session-context';
import ActionBar from '../features/action-bar/components/ActionBar';
import Omnibar from '../features/omni-bar/components/Omnibar';
import ProjectPane from '../features/project-pane/components/ProjectPane';
import StatusBar from '../features/status-bar/components/StatusBar';
import TabView from '../features/tabs/components/TabView';
import { checkShortcut } from '../lib/keyboard-shortcuts';
import { requestFlight } from '../store/flight/actions';
import { loadTabPreferences, startProject } from '../store/project/actions';

const ProjectMain: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const [title, setTitle] = useState('Loading... - Beak');
	const [setup, setSetup] = useState(false);
	const project = useSelector(s => s.global.project);
	const variableGroups = useSelector(s => s.global.variableGroups);
	const { selectedTabPayload, tabs } = useSelector(s => s.global.project);
	const selectedTab = tabs.find(t => t.payload === selectedTabPayload);
	const windowSession = useContext(WindowSessionContext);

	const loaded = project.loaded && variableGroups.loaded;

	useEffect(() => {
		dispatch(startProject());
	}, []);

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown);

		return () => window.removeEventListener('keydown', onKeyDown);
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

		dispatch(loadTabPreferences());
		window.setTimeout(() => setSetup(true), 300);

		setTitle(`${project.name} - Beak`);
	}, [setup, project, project.name, loaded]);

	function onKeyDown(event: KeyboardEvent) {
		if (!selectedTab || event.key !== 'Return')
			return;

		const isDarwin = windowSession.isDarwin();
		const isAct = (isDarwin && event.metaKey) || (!isDarwin && event.ctrlKey);

		if (isAct)
			dispatch(requestFlight());
	}

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
