import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import useShareLink from '@beak/ui/hooks/use-share-link';
import { Copy, Share } from 'lucide-react';

import type { ValidRequestNode } from '@getbeak/types/nodes';
import React from 'react';
import { useContext } from 'react';
import styled from 'styled-components';

import { createBasicHttpOutput } from '../molecules/RequestOutput';

interface RequestPaneSplitterProps {
	selectedNode: ValidRequestNode;
}

const RequestPaneSplitter: React.FC<RequestPaneSplitterProps> = props => {
	const { selectedNode } = props;
	const context = useVariableContext(selectedNode.id);
	const windowSession = useContext(WindowSessionContext);
	const shareUrl = useShareLink(selectedNode.id);

	function copyRequestPreview() {
		createBasicHttpOutput(selectedNode.info, context, windowSession).then(output =>
			navigator.clipboard.writeText(output),
		);
	}

	return (
		<Container>
			<PreviewLabel>{'Request preview'}</PreviewLabel>
			<ActionsContainer>
				<ActionButton onClick={copyRequestPreview}>
					<Copy id={'tt-request-preview-copy'} />
				</ActionButton>
				<ActionSeparator />
				<ActionButton onClick={() => navigator.clipboard.writeText(shareUrl)}>
					<Share id={'tt-request-preview-share'} />
				</ActionButton>
			</ActionsContainer>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: var(--beak-colors-bg-canvas);
	border: 1px solid var(--beak-colors-border-default);
	border-left: none;
	border-right: none;

	padding: 7px 9px;
`;

const PreviewLabel = styled.div`
	font-size: 13px;
	color: var(--beak-colors-fg-default);
`;

const ActionsContainer = styled.div`
	display: flex;
	pointer-events: all;
`;
const ActionButton = styled.button`
	background: none;
	border: none;
	color: var(--beak-colors-fg-default);
	font-size: 11px;
	line-height: 12px;
	cursor: pointer;
	padding: 0 5px;
`;
const ActionSeparator = styled.div`
	margin: 0 5px;
	width: 1px;
	background: var(--beak-colors-border-default);
`;

export default RequestPaneSplitter;
