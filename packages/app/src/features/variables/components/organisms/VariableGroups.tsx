import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import styled from 'styled-components';

import VariableGroupItem from '../molecules/VariableGroupItem';

const VariableGroups: React.FunctionComponent = () => {
	const variableGroups = useSelector(s => s.global.variableGroups.variableGroups);
	const container = useRef<HTMLDivElement>(null);

	return (
		<Container tabIndex={-1} ref={container}>
			{TypedObject.keys(variableGroups).map(v => (
				<VariableGroupItem key={v} variableGroupName={v} />
			))}
		</Container>
	);
};

const Container = styled.div`
	flex-grow: 2;
	overflow-y: overlay;

	&:focus {
		outline: none;
	}
`;

export default VariableGroups;
