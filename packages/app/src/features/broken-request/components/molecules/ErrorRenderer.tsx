import { createDefaultOptions } from '@beak/app/utils/monaco';
import Squawk from '@beak/common/utils/squawk';
import Editor from '@monaco-editor/react';
import React from 'react';
import styled from 'styled-components';

interface ErrorRendererProps {
	error: Squawk;
}

const ErrorRenderer: React.FunctionComponent<ErrorRendererProps> = ({ error }) => (
	<EditorContainer>
		<EditorHeader>{'Error body'}</EditorHeader>
		<Editor
			height={'100%'}
			width={'100%'}
			language={'json'}
			theme={'vs-dark'}
			value={JSON.stringify(error, null, '\t')}
			options={{
				...createDefaultOptions(),
				lineNumbers: false,
				readOnly: true,
			}}
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
	padding: 5px 8px;

	font-size: 14px;
	font-weight: 600;
	color: ${p => p.theme.ui.textMinor};
	text-transform: uppercase;
`;

export default ErrorRenderer;
