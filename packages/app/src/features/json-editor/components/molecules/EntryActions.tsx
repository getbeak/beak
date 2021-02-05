import actions from '@beak/app/store/project/actions';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

interface EntryActionsProps {
	requestId: string;
	jPath: string;
}

const EntryActions: React.FunctionComponent<EntryActionsProps> = props => {
	const { requestId, jPath } = props;
	const dispatch = useDispatch();
	const isRoot = jPath === '';

	return (
		<Wrapper>
			{!isRoot && (
				<Button tabIndex={-1} onClick={() => {
					// Show warning??
					dispatch(actions.requestBodyJsonEditorRemoveEntry({
						jPath,
						requestId,
					}));
				}}>
					{'-'}
				</Button>
			)}
			<Button tabIndex={-1} onClick={() => {
				dispatch(actions.requestBodyJsonEditorAddEntry({
					jPath,
					requestId,
				}));
			}}>
				{'+'}
			</Button>
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

const Button = styled.button`
	width: 15px; height: 15px;
	text-align: center;
	margin-right: 5px;
	padding: 0;

	background: none;
	border: 1px solid ${p => p.theme.ui.blankFill};
	color: ${p => p.theme.ui.blankFill};
	border-radius: 100%;
	line-height: 15px;
`;

export default EntryActions;
