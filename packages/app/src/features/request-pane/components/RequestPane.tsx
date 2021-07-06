import BeakHubContext from '@beak/app/contexts/beak-hub-context';
import BeakRequestPreferences from '@beak/app/lib/beak-hub/request-preferences';
import { alertClear, alertInsert, alertRemoveDependents } from '@beak/app/store/project/actions';
import { RequestNode } from '@beak/common/types/beak-project';
import ksuid from '@cuvva/ksuid';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import styled from 'styled-components';

import ReflexSplitter from '../../../components/atoms/ReflexSplitter';
import RequestPreferencesContext from '../contexts/request-preferences-context';
import RequestOutput from './molecules/RequestOutput';
import Header from './organisms/Header';
import Modifiers from './organisms/Modifiers';

const allowedBodyVerbs = ['GET', 'HEAD', 'DELETE'];

const RequestPane: React.FunctionComponent = () => {
	const mounted = useRef(false);
	const [preferences, setPreferences] = useState<BeakRequestPreferences>();
	const { tree, selectedTabPayload } = useSelector(s => s.global.project);
	const selectedNode = tree[selectedTabPayload!] as RequestNode;
	const hub = useContext(BeakHubContext);
	const dispatch = useDispatch();

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, []);

	useEffect(() => {
		if (!selectedTabPayload || !selectedNode)
			return;

		const reqPref = new BeakRequestPreferences(hub!, selectedNode.id);

		reqPref.load().then(() => {
			if (!mounted.current)
				return;

			setPreferences(reqPref);
		});
	}, [selectedTabPayload, selectedNode.id]);

	useEffect(() => {
		if (selectedNode.type !== 'request')
			return () => { /* */ };

		const info = selectedNode.info;
		const hasBody = info.body.type !== 'text' || info.body.payload !== '';

		if (allowedBodyVerbs.includes(info.verb.toUpperCase()) && hasBody) {
			dispatch(alertInsert({
				ident: ksuid.generate('alert').toString(),
				alert: {
					type: 'http_body_not_allowed',
					dependencies: {
						requestId: selectedNode.id,
					},
				},
			}));
		}

		return () => dispatch(alertRemoveDependents({ requestId: selectedNode.id }));
	}, [selectedNode.id, selectedNode.info]);

	// TODO(afr): Maybe some sort of purgatory state here
	if (!selectedTabPayload)
		return <Container />;

	if (!preferences)
		return <Container />;

	// TODO(afr): Handle this state
	if (selectedTabPayload && !selectedNode)
		return <span>{'TODO: id does not exist'}</span>;

	return (
		<RequestPreferencesContext.Provider value={preferences}>
			<Container>
				<Header node={selectedNode} />
				<ReflexContainer orientation={'horizontal'}>
					<ReflexElement
						flex={8}
						minSize={400}
					>
						<Modifiers node={selectedNode} />
					</ReflexElement>

					<ReflexSplitter orientation={'horizontal'} />

					<ReflexElement
						flex={2}
						minSize={150}
						style={{ overflowY: 'hidden' }}
					>
						<RequestOutput selectedNode={selectedNode} />
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
