import BeakHubContext from '@beak/app/contexts/beak-hub-context';
import { RequestPreference } from '@beak/common/dist/types/beak-hub';
import { RequestNode } from '@beak/common/types/beak-project';
import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../../../components/atoms/ReflexSplitter';
import RequestPreferencesContext from '../contexts/request-preferences-context';
import RequestOutput from './molecules/RequestOutput';
import Modifiers from './organisms/Modifiers';
import UriPane from './organisms/UriSection';

const RequestPane: React.FunctionComponent = () => {
	const [preferences, setPreferences] = useState<RequestPreference | null>(null);
	const [editorHeight, setEditorHeight] = useState<string>('100%');
	const { tree, selectedRequest } = useSelector(s => s.global.project);
	const selectedNode = tree![selectedRequest || 'non_existent'];
	const hub = useContext(BeakHubContext);

	useEffect(() => {
		if (!selectedRequest)
			return;

		hub!.getRequestPreferences(selectedRequest).then(setPreferences);
	}, [selectedRequest]);

	// TODO(afr): Maybe some sort of purgatory state here
	if (!selectedRequest)
		return <Container />;

	if (!preferences)
		return <Container />;

	if (selectedRequest && !selectedNode)
		return <span>{'id does not exist'}</span>;

	const typedSelectedNode = selectedNode as RequestNode;

	return (
		<RequestPreferencesContext.Provider value={preferences}>
			<Container>
				<UriPane node={typedSelectedNode} />
				<ReflexContainer orientation={'horizontal'}>
					<ReflexElement
						flex={8}
						minSize={400}
					>
						<Modifiers node={typedSelectedNode} />
					</ReflexElement>

					<ReflexSplitter orientation={'horizontal'} />

					<ReflexElement
						flex={2}
						minSize={150}
						onResize={e => setEditorHeight(`${(e.domElement as Element).clientHeight}px`)}
						style={{ overflowY: 'hidden' }}
					>
						<RequestOutput
							editorHeight={editorHeight}
							selectedNode={typedSelectedNode}
						/>
					</ReflexElement>
				</ReflexContainer>
			</Container>
		</RequestPreferencesContext.Provider>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;

	height: calc(100% - 39px);
	width: 100%;

	background-color: ${props => props.theme.ui.surface};
`;

export default RequestPane;
