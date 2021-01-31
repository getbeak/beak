import { Entries } from '@beak/common/types/beak-json-editor';
import React from 'react';
import styled from 'styled-components';

import {
	HeaderAction,
	HeaderKeyCell,
	HeaderTypeCell,
	HeaderValueCell,
} from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import { JsonItemEntry } from './molecules/JsonItem';

interface JsonEditorProps {
	value: Entries;
}

const JsonEditor: React.FunctionComponent<JsonEditorProps> = ({ value }) => (
	<Wrapper>
		<Header>
			<Row>
				<HeaderKeyCell>{'Key'}</HeaderKeyCell>
				<HeaderTypeCell>{'Type'}</HeaderTypeCell>
				<HeaderValueCell>{'Value'}</HeaderValueCell>
				<HeaderAction />
			</Row>
		</Header>
		<Body>
			<JsonItemEntry
				depth={0}
				value={value}
			/>
		</Body>
	</Wrapper>
);

export default JsonEditor;

const Wrapper = styled.div`
	margin-top: 5px;
	width: 100%;

	font-size: 12px;
	font-weight: 400;

	color: ${p => p.theme.ui.textMinor};
`;
