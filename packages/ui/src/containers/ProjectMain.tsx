import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';

import ReflexStyles from '../components/atoms/ReflexStyles';
import ErrorBoundary from '../components/molecules/ErrorBoundary';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import ProjectLoadFailed from '../components/molecules/ProjectLoadFailed';
import ProjectLoading from '../components/molecules/ProjectLoading';
import UntitledBanner from '../components/molecules/UntitledBanner';
import ActionBar from '../features/action-bar/components/ActionBar';
import CloneRepoDialog from '../features/clone-repo/components/CloneRepoDialog';
import ProjectEncryption from '../features/encryption/components/ProjectEncryption';
import Omnibar from '../features/omni-bar/components/Omnibar';
import OpenApiImportDialog from '../features/openapi-import/components/OpenApiImportDialog';
import { useOpenApiAutoSync } from '../features/project-home/hooks/use-openapi-auto-sync';
import Sidebar from '../features/sidebar/components/Sidebar';
import SidebarResizer from '../features/sidebar/components/SidebarResizer';
import { useSidebarWidth } from '../features/sidebar/hooks/use-sidebar-width';
import SourceControlDialog from '../features/source-control/components/SourceControlDialog';
import TabView from '../features/tabs/components/TabView';
import { useApplicationMenuEventListener } from '../hooks/use-application-menu-event-listener';
import { useGlobalKeyboardShortcuts } from '../hooks/use-global-keyboard-shortcuts';
import { useProjectBootstrap } from '../hooks/use-project-bootstrap';
import { useProjectLoading } from '../hooks/use-project-loading';
import { useUnsavedChangesGuard } from '../hooks/use-unsaved-changes-guard';

const embedded = Boolean(window.embeddedIndicator);

const ProjectMain: React.FC = () => {
	const [title, setTitle] = useState('Loading… - Beak');
	const [setup, setSetup] = useState(false);
	const collapsedSidebar = useAppSelector(s => s.global.preferences.sidebar.collapsed.sidebar);
	const sidebarControl = useSidebarWidth();
	const project = useAppSelector(s => s.global.project);
	const variableSets = useAppSelector(s => s.global.variableSets);
	const tabs = useAppSelector(s => s.features.tabs);
	const activeTab = tabs.activeTabs.find(t => t.payload === tabs.selectedTab);

	const loaded = project.loaded && variableSets.loaded && tabs.loaded;
	const projectLoading = useProjectLoading(loaded, setup);

	useApplicationMenuEventListener();
	useProjectBootstrap();
	useGlobalKeyboardShortcuts(loaded && setup);
	useOpenApiAutoSync(loaded && setup);
	useUnsavedChangesGuard();

	useEffect(() => {
		if (!loaded || setup) return void 0;

		const id = window.setTimeout(() => setSetup(true), 300);

		setTitle(`${project.name} - Beak`);

		return () => window.clearTimeout(id);
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
						<Flex flex='1' minH='0' direction='row'>
							<Box
								w={`${collapsedSidebar ? 48 : Math.round(sidebarControl.width)}px`}
								flexShrink={0}
								h='100%'
								minH='0'
								overflow='hidden'
								transition={sidebarControl.dragging ? 'none' : 'width .16s ease'}
							>
								<ErrorBoundary variant='panel' label='Sidebar'>
									<Sidebar />
								</ErrorBoundary>
							</Box>

							{!collapsedSidebar && <SidebarResizer control={sidebarControl} />}

							<Box flex='1' minW='0' h='100%' position='relative' overflowY='hidden'>
								{embedded && (
									<ErrorBoundary variant='inline' label='Action bar'>
										<ActionBar />
									</ErrorBoundary>
								)}
								<ErrorBoundary variant='full' label='Workbench'>
									<TabView
										tabs={tabs.activeTabs}
										selectedTab={activeTab}
										rightSlot={
											embedded ? undefined : (
												<ErrorBoundary variant='inline' label='Action bar'>
													<ActionBar inline />
												</ErrorBoundary>
											)
										}
									/>
								</ErrorBoundary>
							</Box>
						</Flex>
						<ErrorBoundary variant='panel' label='Omnibar'>
							<Omnibar />
						</ErrorBoundary>
						<ErrorBoundary variant='panel' label='OpenAPI import'>
							<OpenApiImportDialog />
						</ErrorBoundary>
						<ErrorBoundary variant='panel' label='Source control'>
							<SourceControlDialog />
						</ErrorBoundary>
						<ErrorBoundary variant='panel' label='Clone repo'>
							<CloneRepoDialog />
						</ErrorBoundary>
					</React.Fragment>
				)}
			</Box>

			<ProjectEncryption />

			{project.loadError ? <ProjectLoadFailed error={project.loadError} /> : projectLoading && <ProjectLoading />}
		</React.Fragment>
	);
};

export default ProjectMain;
