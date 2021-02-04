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

	return (
		<Wrapper>
			<Button onClick={() => {
				// Show warning??
				dispatch(actions.requestBodyJsonEditorRemoveEntry({
					jPath,
					requestId,
				}));
			}}>
				{'-'}
			</Button>
			<Button onClick={() => {
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
	
`;

const Button = styled.div`
	display: inline-block;
	width: 15px; height: 15px;
	text-align: center;

	background: none;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	border-radius: 100%;
`;

export default EntryActions;
