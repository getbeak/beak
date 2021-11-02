import Button from '@beak/app/components/atoms/Button';
import { tabSelected } from '@beak/app/store/project/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestNode } from '@beak/common/types/beak-project';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

const NotTheTabYourLookingFor: React.FunctionComponent = () => {
	const tree = useSelector(s => s.global.project.tree);
	const dispatch = useDispatch();

	function spinThatWheel() {
		const requests = TypedObject.values(tree).filter(n => n.type === 'request') as RequestNode[];

		if (requests.length === 0) {
			dispatch(tabSelected({
				type: 'renderer',
				payload: 'variable_group_editor',
				temporary: false,
			}));

			return;
		}

		dispatch(tabSelected({
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
