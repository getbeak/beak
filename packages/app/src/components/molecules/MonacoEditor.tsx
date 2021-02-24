import { createDefaultOptions } from '@beak/app/utils/monaco';
import React from 'react';
import ReactMonacoEditor from 'react-monaco-editor';

interface MonacoEditorProps {
	language: string;
	readOnly?: boolean;
	value: string;
}

const MonacoEditor: React.FunctionComponent<MonacoEditorProps> = props => {
	const { language, readOnly, value } = props;

	return (
		<ReactMonacoEditor
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
