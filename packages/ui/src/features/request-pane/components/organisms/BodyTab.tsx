import { TypedObject } from '@beak/common/helpers/typescript';
import type { RequestEditorMode } from '@beak/common/types/beak-hub';
import EditorView from '@beak/ui/components/atoms/EditorView';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import GraphQlQueryEditor from '@beak/ui/features/graphql-editor/components/GraphQlQueryEditor';
import GraphQlVariablesEditor from '@beak/ui/features/graphql-editor/components/GraphQlVariablesEditor';
import type { EditorMode } from '@beak/ui/features/graphql-editor/types';
import JsonEditor from '@beak/ui/features/json-editor/components/JsonEditor';
import { entryMapToJsonSchema } from '@beak/ui/features/json-schema-import/to-json-schema';
import type { ValueSections } from '@beak/ui/features/variables/values';
import actions, { requestBodyJsonRawChanged, requestBodyTextChanged } from '@beak/ui/store/project/actions';
import { contentTypeToMonacoLanguage } from '@beak/ui/utils/monaco';
import { Box, Flex, Text } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyJson, RequestBodyType, ToggleKeyValue } from '@getbeak/types/request';
import { Braces, FileText, Info } from 'lucide-react';
import React from 'react';
import { useDispatch } from 'react-redux';
import BodyTypeSelector from '../molecules/BodyTypeSelector';
import FileUploadView from '../molecules/FileUploadView';
import MultipartView from '../molecules/MultipartView';

/**
 * Read the first literal Content-Type header off a request (ignoring variable
 * references — those resolve at flight time, not in the editor) so the text
 * body's Monaco language can be picked from it. Returns null when there's no
 * header, no enabled header, or the value contains a variable blob.
 */
function readLiteralContentType(headers: Record<string, ToggleKeyValue>): string | null {
	const match = TypedObject.values(headers).find(h => h.enabled && h.name.toLowerCase() === 'content-type');
	if (!match) return null;
	const parts = match.value;
	if (parts.length !== 1 || typeof parts[0] !== 'string') return null;
	return parts[0];
}

/**
 * Empty-state overlay for the Monaco-backed text / json_raw editors. The
 * Monaco surface itself is unstyled and gives no signal that you can click
 * into it, so when the body is empty we float a small icon + label
 * combination in the middle of the pane. Pointer events pass through so a
 * click still lands on the editor and starts typing — the overlay is a hint,
 * not a button.
 */
const EmptyBodyHint: React.FC<{ icon: React.ReactNode; label: string; hint: string }> = ({ icon, label, hint }) => (
	<Flex
		position='absolute'
		inset='0'
		align='center'
		justify='center'
		direction='column'
		gap='2'
		pointerEvents='none'
		userSelect='none'
		color='fg.subtle'
		px='6'
	>
		<Flex
			align='center'
			justify='center'
			w='32px'
			h='32px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)'
			color='fg.subtle'
		>
			{icon}
		</Flex>
		<Text fontSize='sm' fontWeight='500' color='fg.muted'>
			{label}
		</Text>
		<Text fontSize='xs' textAlign='center' maxW='280px' color='fg.subtle'>
			{hint}
		</Text>
	</Flex>
);

export interface BodyTabProps {
	node: ValidRequestNode;
	graphQlMode: EditorMode;
	editorMode: RequestEditorMode;
	onBodyTypeChange: (type: RequestBodyType) => void;
	onGraphQlModeChange: (mode: EditorMode) => void;
}

/**
 * Friendly inline note explaining that the current body type has no
 * structural schema to author — used in schema mode for text / json_raw
 * / file (all opaque blobs from the contract's point of view).
 */
const SchemaNoStructure: React.FC<{ label: string; hint: string }> = ({ label, hint }) => (
	<Flex direction='column' align='center' justify='center' flex='1' minH='180px' gap='3' color='fg.subtle' px='8' py='8'>
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
	const { node, graphQlMode, editorMode, onBodyTypeChange, onGraphQlModeChange } = props;
	const { body } = node.info;
	const isSchema = editorMode === 'schema';
	// Pick Monaco language for the free-text editor from any literal
	// Content-Type header on the request. Lets users author XML / YAML / etc.
	// inline with proper highlighting without forcing a body-type switch.
	const detectedLanguage = contentTypeToMonacoLanguage(readLiteralContentType(node.info.headers)) ?? 'text';
	// Opaque body types — bytes pass through as-is with no per-field schema.
	// We surface a small contextual hint so users know schema-aware editing
	// (required / type / description) is unavailable here, and which body
	// types they can switch to for it.
	const isOpaqueBody = body.type === 'text' || body.type === 'json_raw' || body.type === 'file';

	return (
		<Flex direction='column' h='100%'>
			{/* Body-type selector lives at the top of the tab content (rather
			    than in the request-pane header strip) so the tab label and
			    the dropdown aren't fighting for the same idea. */}
			<Flex
				align='center'
				h='32px'
				px='2'
				gap='2'
				borderBottomWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
				flexShrink={0}
			>
				{isOpaqueBody && (
					<Box fontSize='10.5px' color='fg.subtle' display='inline-flex' alignItems='center' gap='1.5'>
						<Info size={11} strokeWidth={1.8} />
						<Box as='span'>
							{'Opaque body — switch to a schema-aware type to author required / type / description per field.'}
						</Box>
					</Box>
				)}
				<Box flex='1' />
				<BodyTypeSelector
					value={body.type}
					graphQlMode={graphQlMode}
					onTypeChange={onBodyTypeChange}
					onGraphQlModeChange={onGraphQlModeChange}
				/>
			</Flex>
			<Box
				flex='1'
				minH={0}
				overflowY={
					body.type === 'graphql' && graphQlMode === 'split'
						? 'hidden'
						: body.type !== 'text' && body.type !== 'json_raw'
							? 'auto'
							: 'hidden'
				}
			>
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
							schemaId={node.id}
							// When the body was previously a structured `json`
							// body, `schemaSeed` carries the EntryMap forward. We
							// generate a Draft 2020-12 JSON Schema from it on the
							// fly so Monaco can validate the raw text against the
							// authored shape — required fields, types, enum
							// options all light up live in the editor.
							jsonSchema={body.schemaSeed ? (entryMapToJsonSchema(body.schemaSeed) ?? undefined) : undefined}
							onChange={text => dispatch(requestBodyJsonRawChanged({ requestId: node.id, text: text ?? '' }))}
						/>
						{body.payload === '' && (
							<EmptyBodyHint
								icon={<Braces size={14} strokeWidth={1.8} />}
								label='Empty raw JSON body'
								hint='Click anywhere here to start typing. Variables can be inserted with ${…}.'
							/>
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
							language={detectedLanguage}
							value={body.payload}
							onChange={text => dispatch(requestBodyTextChanged({ requestId: node.id, text: text ?? '' }))}
						/>
						{body.payload === '' && (
							<EmptyBodyHint
								icon={<FileText size={14} strokeWidth={1.8} />}
								label='Empty body'
								hint='Click anywhere here to start typing, or paste content from the clipboard.'
							/>
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
					<GraphQlVariablesEditor node={node} schemaMode={false} />
				)}
				{body.type === 'graphql' && graphQlMode === 'split' && (
					<Box display='grid' gridTemplateColumns='minmax(0, 1fr) minmax(0, 1fr)' h='100%' minH={0}>
						<Box minW={0} h='100%' borderRightWidth='1px' borderColor='border.subtle'>
							<GraphQlQueryEditor node={node} />
						</Box>
						<Box minW={0} h='100%' overflow='auto'>
							<GraphQlVariablesEditor node={node} schemaMode={false} />
						</Box>
					</Box>
				)}
				{!isSchema && body.type === 'file' && <FileUploadView node={node} />}
				{!isSchema && body.type === 'multipart' && <MultipartView node={node} />}
			</Box>
		</Flex>
	);
};

export default BodyTab;
