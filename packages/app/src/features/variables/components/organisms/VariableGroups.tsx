import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import styled from 'styled-components';

import VariableGroupItem from '../molecules/VariableGroupItem';

const VariableGroups: React.FunctionComponent = () => {
	const variableGroups = useSelector(s => s.global.variableGroups.variableGroups);
	const container = useRef<HTMLDivElement>(null);
	const variableGroupKeys = TypedObject.keys(variableGroups);
	const empty = variableGroupKeys.length === 0;

	return (
		<Container tabIndex={-1} ref={container}>
			{empty && <EmptyWarning>{'It\'s looking empty in here...'}</EmptyWarning>}

			{variableGroupKeys.map(v => <VariableGroupItem key={v} variableGroupName={v} />)}
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

const EmptyWarning = styled.div`
	color: ${p => p.theme.ui.textMinor};
	margin-left: 5px;
	font-size: 13px;
`;

export default VariableGroups;
