import React from 'react';
import styled from 'styled-components';

interface EntryActionsProps {
	requestId: string;
	jPath: string;
}

const EntryActions: React.FunctionComponent<EntryActionsProps> = props => {
	const { requestId, jPath } = props;

	return (
		<Wrapper>
			
		</Wrapper>
	);
};

export const ExtryFolderIrrelevant: React.FunctionComponent = () => (<Wrapper />);

const Wrapper = styled.div`
	
`;

export default EntryActions;
