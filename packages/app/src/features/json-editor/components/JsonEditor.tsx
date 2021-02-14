import { TypedObject } from '@beak/common/helpers/typescript';
import { EntryMap } from '@beak/common/types/beak-json-editor';
import React from 'react';
import styled from 'styled-components';

import {
	HeaderAction,
	HeaderKeyCell,
	HeaderTypeCell,
	HeaderValueCell,
} from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import { JsonEntry } from './molecules/JsonEntry';

interface JsonEditorProps {
	requestId: string;
	value: EntryMap;
}

const JsonEditor: React.FunctionComponent<JsonEditorProps> = ({ requestId, value }) => {
	const root = TypedObject.values(value).find(e => e.parentId === null);

	return (
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
				<JsonEntry
					requestId={requestId}
					depth={0}
					value={root!}
				/>
			</Body>
		</Wrapper>
	);
}

export default JsonEditor;

const Wrapper = styled.div`
	margin-top: 5px;
	width: 100%;

	font-size: 12px;
	font-weight: 400;

	color: ${p => p.theme.ui.textMinor};
`;
