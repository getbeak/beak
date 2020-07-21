import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RequestNode } from '../../../lib/project/types';
import ModifiersPane from './organisms/ModifierTabs';
import UriPane from './organisms/UriPane';

const RequesterPane: React.FunctionComponent = () => {
	const { tree, selectedRequest } = useSelector(s => s.global.project);
	const selectedNode = tree![selectedRequest || 'non_existent'];

	// TODO(afr): Maybe some sort of purgatory state here
	if (!selectedRequest)
		return <Container />;

	if (selectedRequest && !selectedNode)
		throw new Error('fucked state?!');

	const typedSelectedNode = selectedNode as RequestNode;

	return (
		<Container>
			<UriPane node={typedSelectedNode} />
			<ModifiersPane node={typedSelectedNode} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.secondaryBackground};
	height: 100%;
	width: 100%;
`;

export default RequesterPane;
