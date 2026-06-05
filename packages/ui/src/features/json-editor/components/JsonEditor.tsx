import { TypedObject } from '@beak/common/helpers/typescript';
import JsonSchemaImportDialog from '@beak/ui/features/json-schema-import/components/JsonSchemaImportDialog';
import JsonSchemaViewDialog from '@beak/ui/features/json-schema-import/components/JsonSchemaViewDialog';
import type { ApplicationState } from '@beak/ui/store';
import { actions } from '@beak/ui/store/project';
import type {
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorMoveEntryPayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorRemoveEntryPayload,
	RequestBodyJsonEditorTypeChangePayload,
	RequestBodyJsonEditorValueChangePayload,
} from '@beak/ui/store/project/types';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { EntryMap } from '@getbeak/types/body-editor-json';
import type { AnyAction } from '@reduxjs/toolkit';
import { Eye, FileJson } from 'lucide-react';
import * as React from 'react';

import { useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { JsonEditorContext } from '../contexts/json-editor-context';
import {
	HeaderAction,
	HeaderDragCell,
	HeaderFolderCell,
	HeaderKeyCell,
	HeaderToggleCell,
	HeaderTypeCell,
	HeaderValueCell,
} from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import { JsonEntry } from './molecules/JsonEntry';

interface JsonEditorProps {
	requestId: string;
	editorSelector: (state: ApplicationState) => EntryMap;
	value: EntryMap;

	forceRootObject?: boolean;
	/**
	 * When true, render the schema-authoring view: hide value cells and
	 * show description / required affordances. The structural editing
	 * (name, type, add, remove, move) stays available; only value entry
	 * is hidden so the user is focused on shaping the contract.
	 */
	schemaMode?: boolean;
	/**
	 * When true, lock the schema entirely — key cells become static text,
	 * the type chip is non-interactive, drag handles and add/remove buttons
	 * are hidden, and the "Paste schema" button is gone. Value cells and
	 * the per-row enabled toggle stay live. Descriptions surface as an Info
	 * icon next to the key so users still understand the contract without a
	 * schema panel.
	 */
	valuesOnly?: boolean;

	nameChanged?: (payload: RequestBodyJsonEditorNameChangePayload) => AnyAction;
	valueChanged?: (payload: RequestBodyJsonEditorValueChangePayload) => AnyAction;
	typeChanged?: (payload: RequestBodyJsonEditorTypeChangePayload) => AnyAction;
	enabledChanged?: (payload: RequestBodyJsonEditorEnabledChangePayload) => AnyAction;
	addedEntry?: (payload: RequestBodyJsonEditorAddEntryPayload) => AnyAction;
	removedEntry?: (payload: RequestBodyJsonEditorRemoveEntryPayload) => AnyAction;
	movedEntry?: (payload: RequestBodyJsonEditorMoveEntryPayload) => AnyAction;
}

const ChakraButton = chakra('button');

const JsonEditor: React.FC<React.PropsWithChildren<JsonEditorProps>> = props => {
	const { requestId, editorSelector, value, forceRootObject, schemaMode, valuesOnly } = props;
	const root = TypedObject.values(value).find(e => e.parentId === null);
	const [schemaImportOpen, setSchemaImportOpen] = useState(false);
	const [schemaViewOpen, setSchemaViewOpen] = useState(false);
	// "Existing entries" = anything beyond the lone synthetic root. The root
	// is always present so a fresh empty body still gets the helpful
	// "discard?" warning out of the way.
	const hasAuthoredEntries = TypedObject.keys(value).length > 1;

	const ctxValue = useMemo(
		() => ({
			requestId,
			editorSelector,
			schemaMode: Boolean(schemaMode),
			valuesOnly: Boolean(valuesOnly),
			nameChange: props.nameChanged ?? actions.requestBodyJsonEditorNameChange,
			valueChange: props.valueChanged ?? actions.requestBodyJsonEditorValueChange,
			typeChange: props.typeChanged ?? actions.requestBodyJsonEditorTypeChange,
			enabledChange: props.enabledChanged ?? actions.requestBodyJsonEditorEnabledChange,
			descriptionChange: actions.requestBodyJsonEditorDescriptionChange,
			requiredChange: actions.requestBodyJsonEditorRequiredChange,
			optionsChange: actions.requestBodyJsonEditorOptionsChange,
			addEntry: props.addedEntry ?? actions.requestBodyJsonEditorAddEntry,
			removeEntry: props.removedEntry ?? actions.requestBodyJsonEditorRemoveEntry,
			moveEntry: props.movedEntry ?? actions.requestBodyJsonEditorMoveEntry,
		}),
		[
			requestId,
			editorSelector,
			schemaMode,
			valuesOnly,
			props.nameChanged,
			props.valueChanged,
			props.typeChanged,
			props.enabledChanged,
			props.addedEntry,
			props.removedEntry,
			props.movedEntry,
		],
	);

	return (
		<DndProvider backend={HTML5Backend}>
			<JsonEditorContext.Provider value={ctxValue}>
				<Box mt='1.5' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
					{/* "Paste schema" lives in schema-authoring mode only — in
					    Values mode the row eats vertical space without ever
					    being relevant, and in `valuesOnly` mode the schema is
					    locked anyway. Showing it only when the user is in
					    Schema mode keeps the editor flush against the column
					    header the rest of the time. */}
					{schemaMode && (
						<Flex
							justify='flex-end'
							align='center'
							gap='0.5'
							h='24px'
							px='2'
							borderBottomWidth='1px'
							borderColor='border.subtle'
							bg='bg.surface'
						>
							<SchemaHeaderButton onClick={() => setSchemaViewOpen(true)} icon={<Eye size={10} strokeWidth={2} />}>
								{'View JSON Schema'}
							</SchemaHeaderButton>
							<SchemaHeaderButton onClick={() => setSchemaImportOpen(true)} icon={<FileJson size={10} strokeWidth={2} />}>
								{'Paste schema'}
							</SchemaHeaderButton>
						</Flex>
					)}
					<Header>
						<Row
							data-empty='true'
							data-schema-mode={schemaMode ? 'true' : undefined}
							data-values-only={valuesOnly ? 'true' : undefined}
						>
							<HeaderFolderCell />
							<HeaderToggleCell />
							<HeaderKeyCell>{'Key'}</HeaderKeyCell>
							<HeaderTypeCell>{'Type'}</HeaderTypeCell>
							{!schemaMode && <HeaderValueCell>{'Value'}</HeaderValueCell>}
							{schemaMode && <HeaderValueCell>{'Description'}</HeaderValueCell>}
							{valuesOnly ? <HeaderKeyCell>{'Description'}</HeaderKeyCell> : <HeaderAction />}
							<HeaderDragCell />
						</Row>
					</Header>
					<Body>
						<JsonEntry forceRootObject={forceRootObject} requestId={requestId} depth={0} value={root!} />
					</Body>
				</Box>
				{schemaImportOpen && (
					<JsonSchemaImportDialog
						requestId={requestId}
						hasExistingEntries={hasAuthoredEntries}
						onClose={() => setSchemaImportOpen(false)}
					/>
				)}
				{schemaViewOpen && <JsonSchemaViewDialog entries={value} onClose={() => setSchemaViewOpen(false)} />}
			</JsonEditorContext.Provider>
		</DndProvider>
	);
};

/**
 * Small ghost button used in the editor's schema-mode header. Shared chrome
 * for "Paste schema" + "View JSON Schema" so they read as one toolbar group.
 */
const SchemaHeaderButton: React.FC<React.PropsWithChildren<{ onClick: () => void; icon: React.ReactNode }>> = ({
	onClick,
	icon,
	children,
}) => (
	<ChakraButton
		type='button'
		onClick={onClick}
		display='inline-flex'
		alignItems='center'
		gap='1.5'
		h='18px'
		px='1.5'
		border='none'
		bg='transparent'
		color='fg.subtle'
		fontSize='10px'
		fontWeight='600'
		letterSpacing='0.04em'
		textTransform='uppercase'
		cursor='pointer'
		borderRadius='sm'
		_hover={{ color: 'accent.indigo', bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 10%, transparent)' }}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 38%, transparent)',
		}}
	>
		{icon}
		<Box as='span'>{children}</Box>
	</ChakraButton>
);

export default JsonEditor;
