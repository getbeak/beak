import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { Nodes, RequestNode } from '../../../lib/project/types';
import UriPane from './organisms/UriPane';

const RequesterPane: React.FunctionComponent = () => {
	const project = useSelector(s => s.global.project);
	const { tree, selectedRequest } = project;

	const traverse = (nodes: Nodes[]): RequestNode | undefined => nodes.map(n => {
		if (n.type === 'request') {
			if (n.id === selectedRequest)
				return n;

			return void 0;
		}

		return traverse(n.children);
	})
		.flat()
		.filter(Boolean)[0];

	const selectedNode = traverse(tree!);

	if (!selectedRequest)
		return <Container />; // TODO(afr): Maybe some sort of pergatory state here

	if (selectedRequest && !selectedNode)
		throw new Error('fucked state?!');

	return (
		<Container>
			<UriPane node={selectedNode!} />
		</Container>
	);
}

const Container = styled.div`
	display: flex;
	background-color: ${props => props.theme.ui.secondaryBackground};
	height: 100%;
	width: 100%;
`;

export default RequesterPane;
