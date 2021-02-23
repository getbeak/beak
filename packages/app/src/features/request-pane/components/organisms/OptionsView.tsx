import { RequestNode } from '@beak/common/types/beak-project';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

export interface OptionsViewProps {
	node: RequestNode;
}

const OptionsView: React.FunctionComponent<OptionsViewProps> = props => {
	const { node } = props;
	const options = node.info.options;
	const dispatch = useDispatch();

	return (
		<Container>
			
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	height: 100%;
`;

export default OptionsView;
