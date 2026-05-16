import type { RequestEditorMode } from '@beak/common/types/beak-hub';
import EditorView from '@beak/ui/components/atoms/EditorView';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import GraphQlQueryEditor from '@beak/ui/features/graphql-editor/components/GraphQlQueryEditor';
import GraphQlVariablesEditor from '@beak/ui/features/graphql-editor/components/GraphQlVariablesEditor';
import type { EditorMode } from '@beak/ui/features/graphql-editor/types';
import JsonEditor from '@beak/ui/features/json-editor/components/JsonEditor';
import type { ValueSections } from '@beak/ui/features/variables/values';
import actions, { requestBodyJsonRawChanged, requestBodyTextChanged } from '@beak/ui/store/project/actions';
import { Box, Flex, Text } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyJson } from '@getbeak/types/request';
import { Info } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import FileUploadView from '../molecules/FileUploadView';

const TEXT_PLACEHOLDER = 'Empty body — click to start typing, or paste content here.';
const JSON_RAW_PLACEHOLDER = 'Empty JSON body — type a JSON value here.';

export interface BodyTabProps {
	node: ValidRequestNode;
	graphQlMode: EditorMode;
	editorMode: RequestEditorMode;
}

/**
 * Friendly inline note explaining that the current body type has no
 * structural schema to author — used in schema mode for text / json_raw
 * / file (all opaque blobs from the contract's point of view).
 */
const SchemaNoStructure: React.FC<{ label: string; hint: string }> = ({ label, hint }) => (
	<Flex
		direction='column'
		align='center'
		justify='center'
		flex='1'
		minH='180px'
		gap='3'
		color='fg.subtle'
		px='8'
		py='8'
	>
		<Flex
			align='center'
			justify='center'
			w='32px'
			h='32px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 12%, transparent)'
			color='accent.indigo'
		>
			<Info size={14} strokeWidth={1.8} />
		</Flex>
		<Text fontSize='sm' fontWeight='500' color='fg.muted'>
			{label}
		</Text>
		<Text fontSize='xs' textAlign='center' maxW='320px'>
			{hint}
		</Text>
	</Flex>
);

const BodyTab: React.FC<React.PropsWithChildren<BodyTabProps>> = props => {
	const dispatch = useDispatch();
	const { node, graphQlMode, editorMode } = props;
	const { body } = node.info;
	const isSchema = editorMode === 'schema';

	return (
		<Box h='100%' overflowY={body.type !== 'text' && body.type !== 'json_raw' ? 'auto' : 'hidden'}>
			{isSchema && body.type === 'text' && (
				<SchemaNoStructure
					label='Text body — no structural schema'
					hint='Text bodies are opaque to the schema. Switch to Values to edit the payload, or change the body type to JSON / Form for structured fields.'
				/>
			)}
			{isSchema && body.type === 'json_raw' && (
				<SchemaNoStructure
					label='Raw JSON body — no structural schema'
					hint='Raw JSON is authored as text. Switch to Values to edit, or change to structured JSON to define a field-by-field schema.'
				/>
			)}
			{isSchema && body.type === 'file' && (
				<SchemaNoStructure
					label='File body — opaque blob'
					hint='File bodies carry bytes from disk. The schema layer for files only cares about the accept hint — coming in a follow-up.'
				/>
			)}
			{!isSchema && body.type === 'json_raw' && (
				<Box
					position='relative'
					h='100%'
					w='100%'
					bg='var(--beak-colors-bg-canvas)'
					borderTopWidth='1px'
					borderTopColor='border.subtle'
				>
					<EditorView
						language={'json'}
						value={body.payload}
						onChange={text =>
							dispatch(requestBodyJsonRawChanged({ requestId: node.id, text: text ?? '' }))
						}
					/>
					{body.payload === '' && (
						<Box
							position='absolute'
							top='10px'
							left='62px'
							pointerEvents='none'
							color='fg.subtle'
							fontFamily='mono'
							fontSize='12.5px'
							fontStyle='italic'
							userSelect='none'
						>
							{JSON_RAW_PLACEHOLDER}
						</Box>
					)}
				</Box>
			)}
			{!isSchema && body.type === 'text' && (
				<Box
					position='relative'
					h='100%'
					w='100%'
					bg='var(--beak-colors-bg-canvas)'
					borderTopWidth='1px'
					borderTopColor='border.subtle'
				>
					<EditorView
						language={'text'}
						value={body.payload}
						onChange={text => dispatch(requestBodyTextChanged({ requestId: node.id, text: text ?? '' }))}
					/>
					{body.payload === '' && (
						<Box
							position='absolute'
							top='10px'
							left='62px'
							pointerEvents='none'
							color='fg.subtle'
							fontFamily='mono'
							fontSize='12.5px'
							fontStyle='italic'
							userSelect='none'
						>
							{TEXT_PLACEHOLDER}
						</Box>
					)}
				</Box>
			)}
			{body.type === 'json' && (
				<JsonEditor
					requestId={node.id}
					value={body.payload}
					schemaMode={isSchema}
					editorSelector={state => {
						const requestNode = state.global.project.tree[node.id] as ValidRequestNode;
						const jsonBody = requestNode.info.body as RequestBodyJson;

						return jsonBody.payload;
					}}
				/>
			)}
			{body.type === 'url_encoded_form' && (
				<BasicTableEditor
					items={body.payload}
					requestId={node.id}
					addItem={() => dispatch(actions.requestBodyUrlEncodedEditorAddItem({ requestId: node.id }))}
					removeItem={id =>
						dispatch(
							actions.requestBodyUrlEncodedEditorRemoveItem({
								requestId: node.id,
								id,
							}),
						)
					}
					updateItem={(type, id, value) => {
						if (type === 'name') {
							dispatch(
								actions.requestBodyUrlEncodedEditorNameChange({
									requestId: node.id,
									id,
									name: value as string,
								}),
							);
						} else if (type === 'enabled') {
							dispatch(
								actions.requestBodyUrlEncodedEditorEnabledChange({
									requestId: node.id,
									id,
									enabled: value as boolean,
								}),
							);
						} else if (type === 'value') {
							dispatch(
								actions.requestBodyUrlEncodedEditorValueChange({
									requestId: node.id,
									id,
									value: value as ValueSections,
								}),
							);
						}
					}}
				/>
			)}
			{body.type === 'graphql' && graphQlMode === 'query' && <GraphQlQueryEditor node={node} />}
			{body.type === 'graphql' && graphQlMode === 'variables' && (
				<GraphQlVariablesEditor node={node} schemaMode={isSchema} />
			)}
			{!isSchema && body.type === 'file' && <FileUploadView node={node} />}
		</Box>
	);
};

export default BodyTab;
