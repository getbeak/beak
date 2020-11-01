import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { useTheme } from 'styled-components';

import Header from './atoms/Header';
import SectionHeader from './atoms/SectionHeader';
import TreeView from './organisms/TreeView';
import VariableGroups from './organisms/VariableGroups';

interface Collapser {
	project: boolean;
	variableGroup: boolean;
	explorer: boolean;
}

const ProjectPane: React.FunctionComponent = () => {
	const theme = useTheme();
	const project = useSelector(s => s.global.project);
	const [collapser, setCollapser] = useState<Collapser>({
		project: false,
		variableGroup: false,
		explorer: false,
	});

	function toggleCollapser(key: keyof Collapser) {
		setCollapser({
			...collapser,
			[key]: !collapser[key],
		});
	}

	return (
		<Container>
			<Header>{project.name!}</Header>
			<SectionHeader
				collapsed={collapser.project}
				onClick={() => toggleCollapser('project')}
			>
				{'Project'}
			</SectionHeader>
			<SectionHeader
				collapsed={collapser.variableGroup}
				onClick={() => toggleCollapser('variableGroup')}
			>
				{'Variable groups'}

				<FontAwesomeIcon
					icon={faBars}
					color={theme.ui.textOnSurfaceBackground}
					size={'1x'}
					onClick={e => {
						e.stopPropagation();
					}}
				/>
			</SectionHeader>
			<VariableGroups collapsed={collapser.variableGroup} />
			<SectionHeader
				collapsed={collapser.explorer}
				onClick={() => toggleCollapser('explorer')}
			>
				{'Explorer'}
			</SectionHeader>
			<TreeView
				collapsed={collapser.explorer}
				tree={project.tree!}
			/>
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
