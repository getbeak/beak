import { createDefaultOptions } from '@beak/app/utils/monaco';
import Editor from '@monaco-editor/react';
import React from 'react';

interface MonacoEditorProps {
	language: string;
	readOnly?: boolean;
	value: string;
}

const MonacoEditor: React.FunctionComponent<MonacoEditorProps> = props => {
	const { language, readOnly, value } = props;

	return (
		<Editor
			height={'100%'}
			width={'100%'}
			language={language}
			theme={'vs-dark'}
			value={value}
			options={{
				...createDefaultOptions(),
				readOnly,
			}}
		/>
	);
};

export default MonacoEditor;
