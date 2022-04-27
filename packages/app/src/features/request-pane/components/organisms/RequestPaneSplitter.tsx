import React, { useContext } from 'react';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import useRealtimeValueContext from '@beak/app/features/realtime-values/hooks/use-realtime-value-context';
import useShareLink from '@beak/app/hooks/use-share-link';
import { ValidRequestNode } from '@beak/common/types/beak-project';
import { faCopy, faShareFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { createBasicHttpOutput } from '../molecules/RequestOutput';

interface RequestPaneSplitterProps {
	selectedNode: ValidRequestNode;
}

const RequestPaneSplitter: React.FC<RequestPaneSplitterProps> = props => {
	const { selectedNode } = props;
	const context = useRealtimeValueContext(selectedNode.id);
	const windowSession = useContext(WindowSessionContext);
	const shareUrl = useShareLink(selectedNode.id);

	function copyRequestPreview() {
		createBasicHttpOutput(selectedNode.info, context, windowSession)
			.then(output => navigator.clipboard.writeText(output));
	}

	return (
		<Container>
			<PreviewLabel>
				{'Request preview'}
			</PreviewLabel>
			<ActionsContainer>
				<ActionButton onClick={copyRequestPreview}>
					<abbr title={'Copy request preview'}>
						<FontAwesomeIcon icon={faCopy} />
					</abbr>
				</ActionButton>
				<ActionSeparator />
				<ActionButton onClick={() => navigator.clipboard.writeText(shareUrl)}>
					<abbr title={'Create project share link'}>
						<FontAwesomeIcon
							icon={faShareFromSquare}
						/>
					</abbr>
				</ActionButton>
			</ActionsContainer>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: ${p => p.theme.ui.background};
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	border-left: none;
	border-right: none;

	padding: 5px;
`;

const PreviewLabel = styled.div`
	font-size: 12px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const ActionsContainer = styled.div`
	display: flex;
	pointer-events: all;
`;
const ActionButton = styled.button`
	background: none;
	border: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	font-size: 11px;
	line-height: 12px;
	cursor: pointer;
	padding: 0 5px;
`;
const ActionSeparator = styled.div`
	margin: 0 5px;
	width: 1px;
	background: ${p => p.theme.ui.backgroundBorderSeparator};
`;

export default RequestPaneSplitter;
