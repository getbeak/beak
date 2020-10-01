import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../../../components/atoms/ReflexSplitter';
import { RequestNode } from '@beak/common/src/beak-project/types';
import ModifiersPane from './organisms/ModifiersPane';
import RequestOutput from './organisms/RequestOutput';
import UriPane from './organisms/UriPane';

const RequesterPane: React.FunctionComponent = () => {
	const [editorHeight, setEditorHeight] = useState<string>('100%');
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
			<ReflexContainer orientation={'horizontal'}>
				<ReflexElement
					flex={8}
					minSize={400}
				>
					<ModifiersPane node={typedSelectedNode} />
				</ReflexElement>

				<ReflexSplitter orientation={'horizontal'} />

				<ReflexElement
					flex={2}
					minSize={150}
					onResize={e => setEditorHeight(`${(e.domElement as Element).clientHeight}px`)}
				>
					<RequestOutput
						editorHeight={editorHeight}
						selectedNode={typedSelectedNode}
					/>
				</ReflexElement>
			</ReflexContainer>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;

	height: 100%; width: 100%;

	background-color: ${props => props.theme.ui.surface};
`;

export default RequesterPane;
