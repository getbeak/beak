import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import ActionIconButton from '@beak/app/components/molecules/ActionIconButton';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { Entries } from '@getbeak/types/body-editor-json';
import styled from 'styled-components';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryActionsProps {
	requestId: string;
	id: string;
	entry: Entries;
}

const EntryActions: React.FC<React.PropsWithChildren<EntryActionsProps>> = props => {
	const { requestId, id, entry } = props;
	const isRoot = entry.parentId === null;
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;

	// Don't show any icons for root level primitives
	if (isRoot && !['array', 'object'].includes(entry.type))
		return null;

	return (
		<Wrapper>
			{!isRoot && (
				<ActionIconButton
					tabIndex={-1}
					icon={faMinus}
					onClick={() => {
						dispatch(editorContext.removeEntry({
							id,
							requestId,
						}));
					}}
				/>
			)}
			<ActionIconButton
				tabIndex={-1}
				icon={faPlus}
				onClick={() => {
					dispatch(editorContext.addEntry({
						id,
						requestId,
					}));
				}}
			/>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	display: flex;
	height: 100%;

	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
`;

export default EntryActions;
