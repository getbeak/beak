// TODO(afr): Remove this fucking css import one day. styled-components only pls
import 'react-reflex/styles.css';

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ProgressIndicator from '../components/molecules/ProgressIndicator';
import ExplorerPane from '../features/explorer-pane/components/ExplorerPane';
import InspectorPane from '../features/insepector/components/InspectorPane';
import RequesterPane from '../features/requestor/components/RequesterPane';
import StatusBar from '../features/status-bar/components/StatusBar';
import { openProject } from '../store/project/actions';

const ProjectMain: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const [title, setTitle] = useState('Loading... - Beak');
	const params = new URLSearchParams(window.location.search);
	const projectFilePath = decodeURIComponent(params.get('projectFilePath') as string);
	const project = useSelector(s => s.global.project);

	useEffect(() => {
		dispatch(openProject(projectFilePath));
	}, [projectFilePath]);

	useEffect(() => {
		if (project.opening)
			return;

		setTitle(`${project.name} - Beak`);
	}, [project, project.name]);

	return (
		<React.Fragment>
			<Helmet>
				<title>{title}</title>
			</Helmet>
			<ProgressIndicator />
			<Container>
				{!project.opening && (
					<ReflexContainer orientation={'vertical'}>
						<ReflexElement
							propagateDimensions
							size={250}
							minSize={170}
							maxSize={350}
						>
							<ExplorerPane />
						</ReflexElement>

						<ReflexSplitter propagate />

						<ReflexElement
							propagateDimensions
							minSize={400}
						>
							<RequesterPane />
						</ReflexElement>

						<ReflexSplitter propagate />

						<ReflexElement
							propagateDimensions
							minSize={400}
						>
							<InspectorPane />
						</ReflexElement>
					</ReflexContainer>
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
