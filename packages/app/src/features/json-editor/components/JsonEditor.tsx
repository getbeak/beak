import { Entries } from '@beak/common/types/beak-json-editor';
import React from 'react';
import styled from 'styled-components';

interface JsonEditorProps {
	value: Entries;
}

const JsonEditor: React.FunctionComponent<JsonEditorProps> = ({ value }) => {
	return (
		<Wrapper>
			
		</Wrapper>
	);
};

export default JsonEditor;

const Wrapper = styled.div`
	margin-top: 5px;
	width: 100%;
`;
