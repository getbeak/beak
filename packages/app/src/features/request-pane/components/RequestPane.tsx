import { RequestPreference } from '@beak/common/src/beak-hub/types';
import { RequestNode } from '@beak/common/src/beak-project/types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../../../components/atoms/ReflexSplitter';
import RequestPreferencesContext from '../contexts/request-preferences-context';
import Modifiers from './organisms/Modifiers';
import RequestOutput from './organisms/RequestOutput';
import UriPane from './organisms/UriSection';

const { ipcRenderer } = window.require('electron');

const RequestPane: React.FunctionComponent = () => {
	const [preferences, setPreferences] = useState<RequestPreference | null>(null);
	const [editorHeight, setEditorHeight] = useState<string>('100%');
	const { tree, selectedRequest } = useSelector(s => s.global.project);
	const selectedNode = tree![selectedRequest || 'non_existent'];

	useEffect(() => {
		if (!selectedRequest)
			return;

		ipcRenderer.invoke('beak_hub:get-request-preference', selectedRequest).then((pref: RequestPreference) => {
			setPreferences(pref);
		});
	}, [selectedRequest]);

	// TODO(afr): Maybe some sort of purgatory state here
	if (!selectedRequest)
		return <Container />;

	if (!preferences)
		return <Container />;

	if (selectedRequest && !selectedNode)
		throw new Error('fucked state?!');

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

	height: 100%; width: 100%;

	background-color: ${props => props.theme.ui.surface};
`;

export default RequestPane;
