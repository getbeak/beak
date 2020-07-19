// TODO(afr): Remove this fucking css import one day. styled-components only pls
import 'react-reflex/styles.css';

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../components/atoms/ReflexSplitter';
import ExplorerPane from '../features/explorer-pane/components/ExplorerPane';
import RequesterPane from '../features/requestor/components/RequesterPane';
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
			<Container>
				{!project.opening && (
					<ReflexContainer orientation={'vertical'}>
						<ReflexElement
							size={220}
							minSize={170}
						>
							<ExplorerPane />
						</ReflexElement>

						<ReflexSplitter />

						<ReflexElement
							minSize={365}
						>
							<RequesterPane />
						</ReflexElement>

						<ReflexSplitter />

						<ReflexElement>
							{'Inspector'}
						</ReflexElement>
					</ReflexContainer>
				)}
			</Container>
			<StatusContainer>
				<StatusBar />
			</StatusContainer>
			{project.opening && <LoadingMask />}
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
