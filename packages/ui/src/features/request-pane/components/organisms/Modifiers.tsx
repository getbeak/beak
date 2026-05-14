import { TypedObject } from '@beak/common/helpers/typescript';
import type { RequestEditorMode, RequestPreferenceMainTab } from '@beak/common/types/beak-hub';
import BasicTableEditor from '@beak/ui/features/basic-table-editor/components/BasicTableEditor';
import type { EditorMode } from '@beak/ui/features/graphql-editor/types';
import {
	requestPreferenceSetReqEditorMode,
	requestPreferenceSetReqMainTab,
} from '@beak/ui/store/preferences/actions';
import actions from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import SchemaTableEditor from '@beak/ui/features/basic-table-editor/components/SchemaTableEditor';

import { useChangeBodyType } from '../../use-change-body-type';
import BodyTypeSelector from '../molecules/BodyTypeSelector';
import EditorModeToggle from '../molecules/EditorModeToggle';
import BodyTab from './BodyTab';
import OptionsView from './OptionsView';

export interface ModifiersProps {
	node: ValidRequestNode;
}

const TABS: { key: RequestPreferenceMainTab; label: string }[] = [
	{ key: 'headers', label: 'Headers' },
	{ key: 'url_query', label: 'Params' },
	{ key: 'body', label: 'Body' },
	{ key: 'options', label: 'Options' },
];

function bodyTypeLabel(type: string): string {
	switch (type) {
		case 'text':
			return 'Text';
		case 'json':
			return 'JSON';
		case 'json_raw':
			return 'JSON (raw)';
		case 'url_encoded_form':
			return 'Form';
		case 'graphql':
			return 'GraphQL';
		case 'file':
			return 'File';
		default:
			return type;
	}
}

const ChakraButton = chakra('button');

const Modifiers: React.FC<React.PropsWithChildren<ModifiersProps>> = props => {
	const dispatch = useDispatch();
	const { node } = props;
	const preferences = useAppSelector(s => s.global.preferences.requests[node.id])!;
	const tab = preferences.request.mainTab;
	const editorMode: RequestEditorMode = preferences.request.editorMode ?? 'values';
	const [graphQlMode, setGraphQlMode] = useState<EditorMode>('query');
	const changeBodyType = useChangeBodyType(node);

	const headerCount = TypedObject.values(node.info.headers).filter(h => h.enabled).length;
	const queryCount = TypedObject.values(node.info.query).filter(q => q.enabled).length;
	const bodyType = node.info.body.type;
	const bodyLabel = bodyTypeLabel(bodyType);

	function setTab(tab: RequestPreferenceMainTab) {
		dispatch(requestPreferenceSetReqMainTab({ id: node.id, tab }));
	}

	function setEditorMode(mode: RequestEditorMode) {
		dispatch(requestPreferenceSetReqEditorMode({ id: node.id, mode }));
	}

	const showModeToggle = tab !== 'options';

	function counterFor(tabKey: RequestPreferenceMainTab): React.ReactNode {
		switch (tabKey) {
			case 'headers':
				return headerCount > 0 ? headerCount : undefined;
			case 'url_query':
				return queryCount > 0 ? queryCount : undefined;
			case 'body':
				return bodyType === 'text' ? undefined : bodyLabel;
			default:
				return undefined;
		}
	}

	return (
		<Flex direction='column' overflow='hidden' h='100%'>
			<Flex align='center' h='34px' px='2' borderBottomWidth='1px' borderColor='border.subtle' bg='bg.surface'>
				<Flex align='stretch' h='100%' gap='0.5' role='tablist'>
					{TABS.map(t => {
						const active = tab === t.key;
						const counter = counterFor(t.key);
						const isNumericCounter = typeof counter === 'number';
						return (
							<ChakraButton
								key={t.key}
								type='button'
								role='tab'
								aria-selected={active}
								onClick={() => setTab(t.key)}
								position='relative'
								display='inline-flex'
								alignItems='center'
								gap='1.5'
								px='2.5'
								border='none'
								bg='transparent'
								cursor='pointer'
								fontSize='12px'
								fontWeight={active ? '600' : '500'}
								color={active ? 'fg.default' : 'fg.muted'}
								transition='color .12s ease'
								_hover={{ color: 'fg.default' }}
								_focusVisible={{
									outline: 'none',
									boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
									borderRadius: '4px',
								}}
							>
								<Box as='span' position='relative'>
									{t.label}
								</Box>
								{counter !== undefined && (
									<Box
										as='span'
										display='inline-flex'
										alignItems='center'
										justifyContent='center'
										minW={isNumericCounter ? '16px' : undefined}
										h='16px'
										px={isNumericCounter ? '1' : '1.5'}
										fontSize='10px'
										fontWeight='600'
										fontVariantNumeric='tabular-nums'
										letterSpacing={isNumericCounter ? undefined : '0.04em'}
										textTransform={isNumericCounter ? undefined : 'uppercase'}
										color={active ? 'fg.default' : 'fg.subtle'}
										opacity={active ? 1 : 0.7}
									>
										{counter}
									</Box>
								)}
								{active && <Box position='absolute' left='2.5' right='2.5' bottom='-1px' h='2px' bg='accent.pink' />}
							</ChakraButton>
						);
					})}
				</Flex>

				<Box flex='1 1 auto' />

				{showModeToggle && <EditorModeToggle mode={editorMode} onChange={setEditorMode} />}

				{tab === 'body' && (
					<BodyTypeSelector
						value={bodyType}
						graphQlMode={graphQlMode}
						onTypeChange={changeBodyType}
						onGraphQlModeChange={setGraphQlMode}
					/>
				)}
			</Flex>

			<Box flexGrow={2} overflowY='auto' h='100%'>
				{tab === 'headers' && editorMode === 'schema' && (
					<SchemaTableEditor
						items={node.info.headers}
						addItem={() => dispatch(actions.requestHeaderAdded({ requestId: node.id }))}
						removeItem={id =>
							dispatch(
								actions.requestHeaderRemoved({
									requestId: node.id,
									identifier: id,
								}),
							)
						}
						updateItem={(field, id, value) =>
							dispatch(
								actions.requestHeaderUpdated({
									requestId: node.id,
									identifier: id,
									[field]: value,
								}),
							)
						}
					/>
				)}
				{tab === 'headers' && editorMode === 'values' && (
					<BasicTableEditor
						items={node.info.headers}
						requestId={node.id}
						addItem={() => dispatch(actions.requestHeaderAdded({ requestId: node.id }))}
						removeItem={id =>
							dispatch(
								actions.requestHeaderRemoved({
									requestId: node.id,
									identifier: id,
								}),
							)
						}
						updateItem={(type, id, value) =>
							dispatch(
								actions.requestHeaderUpdated({
									requestId: node.id,
									identifier: id,
									[type]: value,
								}),
							)
						}
					/>
				)}
				{tab === 'url_query' && editorMode === 'schema' && (
					<SchemaTableEditor
						items={node.info.query}
						addItem={() => dispatch(actions.requestQueryAdded({ requestId: node.id }))}
						removeItem={id =>
							dispatch(
								actions.requestQueryRemoved({
									requestId: node.id,
									identifier: id,
								}),
							)
						}
						updateItem={(field, id, value) =>
							dispatch(
								actions.requestQueryUpdated({
									requestId: node.id,
									identifier: id,
									[field]: value,
								}),
							)
						}
					/>
				)}
				{tab === 'url_query' && editorMode === 'values' && (
					<BasicTableEditor
						items={node.info.query}
						requestId={node.id}
						addItem={() => dispatch(actions.requestQueryAdded({ requestId: node.id }))}
						removeItem={id =>
							dispatch(
								actions.requestQueryRemoved({
									requestId: node.id,
									identifier: id,
								}),
							)
						}
						updateItem={(type, id, value) =>
							dispatch(
								actions.requestQueryUpdated({
									requestId: node.id,
									identifier: id,
									[type]: value,
								}),
							)
						}
					/>
				)}
				{tab === 'body' && <BodyTab node={node} graphQlMode={graphQlMode} editorMode={editorMode} />}
				{tab === 'options' && <OptionsView node={node} />}
			</Box>
		</Flex>
	);
};

export default Modifiers;
