import { faMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

interface EntryActionsProps {
	onRemove: () => void;
}

const EntryActions: React.FunctionComponent<EntryActionsProps> = ({ onRemove }) => (
	<Wrapper>
		<Button tabIndex={-1} onClick={() => onRemove()}>
			<FontAwesomeIcon icon={faMinus} />
		</Button>
	</Wrapper>
);

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
	/* TODO(afr): Change this to a real colour, not text colour */
	border: 1px solid ${p => p.theme.ui.textMinor};
	color: ${p => p.theme.ui.textMinor};
	border-radius: 100%;
	line-height: 15px;

	box-shadow: 0 0 1px 0px white inset, 0 0 1px 0px white;

	font-size: 8px;
`;

export default EntryActions;
