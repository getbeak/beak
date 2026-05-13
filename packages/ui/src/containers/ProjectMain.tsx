import { useAppSelector } from '@beak/ui/store/redux';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ReflexContainer } from 'react-reflex';
import styled from 'styled-components';

import ReflexElement from '../components/atoms/ReflexElement';
import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ReflexStyles from '../components/atoms/ReflexStyles';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import ProjectLoading from '../components/molecules/ProjectLoading';
import UntitledBanner from '../components/molecules/UntitledBanner';
import ActionBar from '../features/action-bar/components/ActionBar';
import ProjectEncryption from '../features/encryption/components/ProjectEncryption';
import Omnibar from '../features/omni-bar/components/Omnibar';
import Sidebar from '../features/sidebar/components/Sidebar';
import TabView from '../features/tabs/components/TabView';
import { useApplicationMenuEventListener } from '../hooks/use-application-menu-event-listener';
import { useGlobalKeyboardShortcuts } from '../hooks/use-global-keyboard-shortcuts';
import { useProjectBootstrap } from '../hooks/use-project-bootstrap';
import { useProjectLoading } from '../hooks/use-project-loading';

const ProjectMain: React.FC = () => {
	const [title, setTitle] = useState('Loading... - Beak');
	const [setup, setSetup] = useState(false);
	const collapsedSidebar = useAppSelector(s => s.global.preferences.sidebar.collapsed.sidebar);
	const project = useAppSelector(s => s.global.project);
	const variableSets = useAppSelector(s => s.global.variableSets);
	const tabs = useAppSelector(s => s.features.tabs);
	const activeTab = tabs.activeTabs.find(t => t.payload === tabs.selectedTab);

	const loaded = project.loaded && variableSets.loaded && tabs.loaded;
	const projectLoading = useProjectLoading(loaded, setup);

	useApplicationMenuEventListener();
	useProjectBootstrap();
	useGlobalKeyboardShortcuts(loaded && setup);

	useEffect(() => {
		if (!loaded || setup) return;

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
						<UntitledBanner />
						<ReflexContainer orientation={'vertical'}>
							<ReflexElement flex={15} minSize={200} $forcedWidth={collapsedSidebar ? 42 : void 0}>
								<Sidebar />
							</ReflexElement>

							<ReflexSplitter $disabled={collapsedSidebar} hideVisualIndicator orientation={'vertical'} />

							<ReflexElement flex={80} minSize={902} style={{ overflowY: 'hidden' }}>
								<ActionBar />
								<TabView tabs={tabs.activeTabs} selectedTab={activeTab} />
							</ReflexElement>
						</ReflexContainer>
						<Omnibar />
					</React.Fragment>
				)}
			</Container>

			<ProjectEncryption />

			{projectLoading && <ProjectLoading />}
		</React.Fragment>
	);
};

const Container = styled.div`
	position: absolute;
	top: 0; bottom: 0; left: 0; right: 0;
`;

export default ProjectMain;
