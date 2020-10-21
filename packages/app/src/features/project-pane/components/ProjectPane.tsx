import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Header from './atoms/Header';
import SectionHeader from './atoms/SectionHeader';
import TreeView from './organisms/TreeView';

const ProjectPane: React.FunctionComponent = () => {
	const project = useSelector(s => s.global.project);

	return (
		<Container>
			<Header>{project.name!}</Header>
			<SectionHeader>{'Project'}</SectionHeader>
			<SectionHeader>{'Environment'}</SectionHeader>
			<SectionHeader>{'Explorer'}</SectionHeader>
			<TreeView tree={project.tree!} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;

	background-color: ${props => props.theme.ui.secondaryBackground};
	height: 100%;
`;

export default ProjectPane;
