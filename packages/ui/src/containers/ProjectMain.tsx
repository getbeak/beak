import { Box } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ReflexContainer } from 'react-reflex';

import ReflexElement from '../components/atoms/ReflexElement';
import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ReflexStyles from '../components/atoms/ReflexStyles';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import ProjectLoading from '../components/molecules/ProjectLoading';
import UntitledBanner from '../components/molecules/UntitledBanner';
import ActionBar from '../features/action-bar/components/ActionBar';
import ProjectEncryption from '../features/encryption/components/ProjectEncryption';
import Omnibar from '../features/omni-bar/components/Omnibar';
import OpenApiImportDialog from '../features/openapi-import/components/OpenApiImportDialog';
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
			<Box position='absolute' inset='0' display='flex' flexDirection='column'>
				<ReflexStyles />
				{setup && loaded && (
					<React.Fragment>
						<UntitledBanner />
						<Box flex='1' minH='0'>
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
						</Box>
						<Omnibar />
						<OpenApiImportDialog />
					</React.Fragment>
				)}
			</Box>

			<ProjectEncryption />

			{projectLoading && <ProjectLoading />}
		</React.Fragment>
	);
};

export default ProjectMain;
