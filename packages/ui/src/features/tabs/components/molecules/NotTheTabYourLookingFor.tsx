import React from 'react';
import { useDispatch } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import Button from '@beak/ui/components/atoms/Button';
import { useAppSelector } from '@beak/ui/store/redux';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import styled from 'styled-components';

import { changeTab } from '../../store/actions';

const NotTheTabYourLookingFor: React.FC<React.PropsWithChildren<unknown>> = () => {
	const tree = useAppSelector(s => s.global.project.tree);
	const dispatch = useDispatch();

	function spinThatWheel() {
		const requests = TypedObject.values(tree).filter(n => n.type === 'request') as ValidRequestNode[];

		dispatch(changeTab({
			type: 'request',
			payload: requests[Math.floor(Math.random() * requests.length)].id,
			temporary: false,
		}));
	}

	return (
		<Wrapper>
			<Header>{'This is not the tab you\'re looking for'}</Header>
			<Body>{'Why not select a request to get going, or...'}</Body>

			<Button onClick={() => spinThatWheel()}>
				{'Spin the wheel!'}
			</Button>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	height: 100%;
	text-align: center;
	background: ${p => p.theme.ui.background};
	padding: 20px 25px;
`;

const Header = styled.h1`
	margin: 0;
	font-weight: 400;
	font-size: 35px;
	line-height: 25px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const Body = styled.p`
	font-size: 14px;
	color: ${p => p.theme.ui.textOnFill};
`;

export default NotTheTabYourLookingFor;
