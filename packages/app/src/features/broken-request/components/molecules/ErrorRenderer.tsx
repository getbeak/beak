import React from 'react';
import EditorView from '@beak/app/components/atoms/EditorView';
import Squawk from '@beak/common/utils/squawk';
import styled from 'styled-components';

interface ErrorRendererProps {
	error: Squawk;
}

const ErrorRenderer: React.FC<React.PropsWithChildren<ErrorRendererProps>> = ({ error }) => (
	<EditorContainer>
		<EditorHeader>{'Error body'}</EditorHeader>
		<EditorView
			language={'json'}
			value={JSON.stringify(error, null, '\t')}
			options={{ readOnly: true, lineNumbers: 'off' }}
		/>
	</EditorContainer>
);

const EditorContainer = styled.div`
	margin: 0 auto;
	margin-top: 20px;
	height: 100%;
	max-width: 700px;
	max-height: 450px;
	overflow: hidden;

	border-radius: 5px;
	background: ${p => p.theme.ui.surfaceFill};
	border: 2px solid ${p => p.theme.ui.surfaceFill};
`;

const EditorHeader = styled.div`
	text-align: left;
	padding: 6px 4px;

	font-size: 11px;
	font-weight: 600;
	color: ${p => p.theme.ui.textMinor};
	text-transform: uppercase;
`;

export default ErrorRenderer;
