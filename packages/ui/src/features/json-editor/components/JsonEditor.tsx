import { TypedObject } from '@beak/common/helpers/typescript';
import JsonSchemaImportDialog from '@beak/ui/features/json-schema-import/components/JsonSchemaImportDialog';
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
import { FileJson } from 'lucide-react';
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
	const { requestId, editorSelector, value, forceRootObject, schemaMode } = props;
	const root = TypedObject.values(value).find(e => e.parentId === null);
	const [schemaImportOpen, setSchemaImportOpen] = useState(false);
	// "Existing entries" = anything beyond the lone synthetic root. The root
	// is always present so a fresh empty body still gets the helpful
	// "discard?" warning out of the way.
	const hasAuthoredEntries = TypedObject.keys(value).length > 1;

	const ctxValue = useMemo(
		() => ({
			requestId,
			editorSelector,
			schemaMode: Boolean(schemaMode),
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
					{/* Top-row chrome — only the "Paste schema" affordance for
					    now. Sits flush above the column header so it reads as
					    "editor action", not as another row of data. */}
					<Flex
						justify='flex-end'
						align='center'
						h='24px'
						px='2'
						borderBottomWidth='1px'
						borderColor='border.subtle'
						bg='bg.surface'
					>
						<ChakraButton
							type='button'
							onClick={() => setSchemaImportOpen(true)}
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
							<FileJson size={10} strokeWidth={2} />
							<Box as='span'>{'Paste schema'}</Box>
						</ChakraButton>
					</Flex>
					<Header>
						<Row data-empty='true' data-schema-mode={schemaMode ? 'true' : undefined}>
							<HeaderFolderCell />
							<HeaderToggleCell />
							<HeaderKeyCell>{'Key'}</HeaderKeyCell>
							<HeaderTypeCell>{'Type'}</HeaderTypeCell>
							{!schemaMode && <HeaderValueCell>{'Value'}</HeaderValueCell>}
							{schemaMode && <HeaderValueCell>{'Description'}</HeaderValueCell>}
							<HeaderAction />
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
			</JsonEditorContext.Provider>
		</DndProvider>
	);
};

export default JsonEditor;
