import { loadRequestPreferences } from '@beak/ui/store/preferences/actions';
import { alertInsert, alertRemoveDependents } from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { requestAllowsBody } from '@beak/ui/utils/http';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import React from 'react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Flex } from '@chakra-ui/react';
import { ReflexContainer, ReflexElement } from 'react-reflex';

import { HorizontalContextualReflexSplitter } from '../../../components/atoms/ReflexSplitter';
import SelectedNodeContext from '../contexts/selected-node';
import RequestOutput from './molecules/RequestOutput';
import Header from './organisms/Header';
import Modifiers from './organisms/Modifiers';
import RequestPaneSplitter from './organisms/RequestPaneSplitter';

const RequestPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();
	const { tree } = useAppSelector(s => s.global.project);
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const selectedNode = tree[selectedTab!] as ValidRequestNode;
	const preferences = useAppSelector(s => s.global.preferences.requests[selectedNode.id]);

	useEffect(() => {
		dispatch(loadRequestPreferences({ id: selectedNode.id }));
	}, [selectedNode.id, dispatch]);

	useEffect(() => {
		if (selectedNode.type !== 'request')
			return () => {
				/* */
			};

		const info = selectedNode.info;
		const hasBody = info.body.type !== 'text' || info.body.payload !== '';

		if (!requestAllowsBody(info.verb) && hasBody) {
			dispatch(
				alertInsert({
					ident: `alert:http-body-not-allowed:${selectedNode.id}`,
					alert: {
						type: 'http_body_not_allowed',
						dependencies: {
							requestId: selectedNode.id,
						},
					},
				}),
			);
		}

		return () => dispatch(alertRemoveDependents({ requestId: selectedNode.id }));
	}, [selectedNode.id, selectedNode.info, dispatch, selectedNode.type]);

	if (!selectedTab || !preferences || !selectedNode)
		return <Flex direction='column' h='100%' w='100%' bg='bg.surface' />;

	return (
		<SelectedNodeContext.Provider value={selectedNode}>
			<Flex direction='column' h='100%' w='100%' bg='bg.surface'>
				<Header node={selectedNode} />
				<ReflexContainer orientation={'horizontal'}>
					<ReflexElement flex={8} minSize={400}>
						<Modifiers node={selectedNode} />
					</ReflexElement>

					<HorizontalContextualReflexSplitter orientation={'horizontal'}>
						<RequestPaneSplitter selectedNode={selectedNode} />
					</HorizontalContextualReflexSplitter>

					<ReflexElement flex={2} style={{ overflowY: 'hidden' }}>
						<RequestOutput selectedNode={selectedNode} />
					</ReflexElement>
				</ReflexContainer>
			</Flex>
		</SelectedNodeContext.Provider>
	);
};

export default RequestPane;
