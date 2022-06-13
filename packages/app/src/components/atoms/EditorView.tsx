import React from 'react';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import Editor, { EditorProps } from '@monaco-editor/react';
import { useTheme } from 'styled-components';

interface EditorViewProps extends EditorProps { }

const EditorView: React.FC<EditorViewProps> = props => {
	const { theme } = useTheme();

	return (
		<Editor
			theme={theme === 'dark' ? 'vs-dark' : 'light'}
			{...props}
			options={{
				...createDefaultOptions(),
				...props.options,
			}}
		/>
	);
};

export default EditorView;
