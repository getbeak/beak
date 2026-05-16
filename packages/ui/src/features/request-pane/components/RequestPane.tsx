import { usePaneSplit } from '@beak/ui/hooks/use-pane-split';
import { loadRequestPreferences } from '@beak/ui/store/preferences/actions';
import { alertInsert, alertRemoveForScope } from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { requestAllowsBody } from '@beak/ui/utils/http';
import { Box, Flex } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';

import { HorizontalContextualReflexSplitter } from '../../../components/atoms/ReflexSplitter';
import AlertBanner from '../../alerts/components/AlertBanner';
import SelectedNodeContext from '../contexts/selected-node';
import GrpcRequestPane from './GrpcRequestPane';
import IntrospectionBanner from './molecules/IntrospectionBanner';
import OpenApiSyncBanner from './molecules/OpenApiSyncBanner';
import RequestOutput from './molecules/RequestOutput';
import Header from './organisms/Header';
import Modifiers from './organisms/Modifiers';
import RequestPaneToolbar from './organisms/RequestPaneToolbar';

const RequestPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const dispatch = useDispatch();
	const { tree } = useAppSelector(s => s.global.project);
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const selectedNode = tree[selectedTab!] as ValidRequestNode;
	const preferences = useAppSelector(s => s.global.preferences.requests[selectedNode.id]);

	const modRawSplit = usePaneSplit({
		key: 'request-modifiers-raw',
		defaultRatio: 0.9,
		orientation: 'horizontal',
		minRatio: 0.2,
		maxRatio: 0.95,
	});

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
						severity: 'warning',
						scope: { kind: 'request', requestId: selectedNode.id },
					},
				}),
			);
		}

		return () => dispatch(alertRemoveForScope({ kind: 'request', requestId: selectedNode.id }));
	}, [selectedNode.id, selectedNode.info, dispatch, selectedNode.type]);

	if (!selectedTab || !preferences || !selectedNode)
		return <Flex direction='column' h='100%' w='100%' bg='bg.surface' />;

	// gRPC requests use a dedicated pane — none of the HTTP fields (verb,
	// URL, headers, body-type tabs, raw HTTP preview) apply, so we replace
	// the whole layout rather than half-rendering it next to a placeholder.
	if (selectedNode.info.body.type === 'grpc') {
		return (
			<SelectedNodeContext.Provider value={selectedNode}>
				<GrpcRequestPane node={selectedNode} />
			</SelectedNodeContext.Provider>
		);
	}

	return (
		<SelectedNodeContext.Provider value={selectedNode}>
			<Flex direction='column' h='100%' w='100%' bg='bg.surface'>
				{selectedNode.info.introspection === true && <IntrospectionBanner />}
				{selectedNode.info.introspection !== true && <OpenApiSyncBanner requestId={selectedNode.id} />}
				<AlertBanner requestId={selectedNode.id} />
				<Header node={selectedNode} />
				<ReflexContainer orientation={'horizontal'}>
					<ReflexElement flex={modRawSplit.firstFlex} minSize={300} onStopResize={modRawSplit.onStopResize}>
						<Modifiers node={selectedNode} />
					</ReflexElement>

					{/* Splitter doubles as the labelled "Raw HTTP" header bar
					    for the preview pane — grabbing the bar resizes, the
					    buttons inside stop drag propagation so they remain
					    clickable. */}
					<HorizontalContextualReflexSplitter orientation={'horizontal'} style={{ backgroundColor: 'transparent' }}>
						<RequestPaneToolbar selectedNode={selectedNode} />
					</HorizontalContextualReflexSplitter>

					{/* Raw HTTP preview — a glance-able sanity check. Starts
					    small (~10% of pane height) and the user drags up for
					    more. minSize keeps it visible-but-collapsed when the
					    user pulls it nearly closed. */}
					<ReflexElement flex={modRawSplit.secondFlex} minSize={60} style={{ overflowY: 'hidden' }}>
						<Box h='100%' w='100%'>
							<RequestOutput selectedNode={selectedNode} />
						</Box>
					</ReflexElement>
				</ReflexContainer>
			</Flex>
		</SelectedNodeContext.Provider>
	);
};

export default RequestPane;
