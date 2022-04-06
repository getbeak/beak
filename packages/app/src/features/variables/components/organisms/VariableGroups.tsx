import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import styled from 'styled-components';

import VariableGroupItem from '../atoms/VariableGroupItem';

const VariableGroups: React.FunctionComponent = () => {
	const variableGroups = useSelector(s => s.global.variableGroups.variableGroups);
	const container = useRef<HTMLDivElement>(null);

	return (
		<Container tabIndex={-1} ref={container}>
			{TypedObject.keys(variableGroups).map(v => (
				<VariableGroupItem key={v} variableGroupName={v} />
			))}

			{/* <ContextMenuWrapper mode={'root'} target={container.current!}>
				{items.filter(i => i.type === 'folder').map(n => (
					<FolderItem depth={0} key={n.filePath} id={n.filePath} />
				))}

				{items.filter(i => i.type === 'request').map(n => (
					<RequestItem
						depth={0}
						key={n.filePath}
						id={n.id}
						parentNode={null}
					/>
				))}
			</ContextMenuWrapper> */}
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
