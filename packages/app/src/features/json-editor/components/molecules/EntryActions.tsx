import React from 'react';
import { useDispatch } from 'react-redux';
import ActionIconButton from '@beak/app/components/molecules/ActionIconButton';
import actions from '@beak/app/store/project/actions';
import { Entries } from '@beak/common/types/beak-json-editor';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

interface EntryActionsProps {
	requestId: string;
	id: string;
	entry: Entries;
}

const EntryActions: React.FC<React.PropsWithChildren<EntryActionsProps>> = props => {
	const { requestId, id, entry } = props;
	const isRoot = entry.parentId === null;
	const dispatch = useDispatch();

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
						dispatch(actions.requestBodyJsonEditorRemoveEntry({
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
					dispatch(actions.requestBodyJsonEditorAddEntry({
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
