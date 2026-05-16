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
import type { Entries } from '@getbeak/types/body-editor-json';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { ToggleKeyValue } from '@getbeak/types/request';
import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { useChangeBodyType } from '../../use-change-body-type';
import BodyTypeSelector from '../molecules/BodyTypeSelector';
import EditorModeToggle from '../molecules/EditorModeToggle';
import BodyTab from './BodyTab';
import OptionsView from './OptionsView';

/**
 * Mirror of `isValueEmpty` from BasicTableEditor: a ToggleKeyValue's value
 * counts as empty when it has no parts or every part is an empty string.
 */
function isToggleValueEmpty(item: ToggleKeyValue): boolean {
	const parts = item.value;
	if (!parts || parts.length === 0) return true;
	return parts.every(p => typeof p === 'string' && p.length === 0);
}

/**
 * Mirror of `isEntryValueEmpty` from EntryRow — container + intrinsic
 * types satisfy the contract by their presence; string/number entries
 * count as empty when no parts or every part is an empty literal.
 */
function isJsonEntryValueEmpty(entry: Entries): boolean {
	if (entry.type === 'object' || entry.type === 'array') return false;
	if (entry.type === 'boolean' || entry.type === 'null') return false;
	const parts = entry.value;
	if (!parts || parts.length === 0) return true;
	return parts.every(p => typeof p === 'string' && p.length === 0);
}

function countMissingRequiredInBody(node: ValidRequestNode): number {
	const body = node.info.body;
	if (!body) return 0;
	switch (body.type) {
		case 'json':
			return TypedObject.values(body.payload).filter(
				entry => entry.required === true && entry.enabled !== false && isJsonEntryValueEmpty(entry),
			).length;
		case 'url_encoded_form':
			return TypedObject.values(body.payload).filter(
				item => item.required === true && item.enabled !== false && isToggleValueEmpty(item),
			).length;
		case 'graphql':
			return TypedObject.values(body.payload.variables).filter(
				entry => entry.required === true && entry.enabled !== false && isJsonEntryValueEmpty(entry),
			).length;
		default:
			return 0;
	}
}

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

	// Count required fields with empty values per scope. Surfaced as a tiny red
	// badge in the tab label so the user sees "you owe values" without having
	// to open each tab.
	const headersMissing = TypedObject.values(node.info.headers).filter(
		h => h.required === true && h.enabled !== false && isToggleValueEmpty(h),
	).length;
	const queryMissing = TypedObject.values(node.info.query).filter(
		q => q.required === true && q.enabled !== false && isToggleValueEmpty(q),
	).length;
	const bodyMissing = countMissingRequiredInBody(node);

	function setTab(tab: RequestPreferenceMainTab) {
		dispatch(requestPreferenceSetReqMainTab({ id: node.id, tab }));
	}

	function setEditorMode(mode: RequestEditorMode) {
		dispatch(requestPreferenceSetReqEditorMode({ id: node.id, mode }));
	}

	// Headers/query author their schema via per-row expansion now; the binary
	// toggle is only useful when the active body is structured (json /
	// graphql), where rows don't yet have an inline schema affordance.
	const showModeToggle = tab === 'body' && (bodyType === 'json' || bodyType === 'graphql');

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
								{(() => {
									const missing =
										t.key === 'headers'
											? headersMissing
											: t.key === 'url_query'
												? queryMissing
												: t.key === 'body'
													? bodyMissing
													: 0;
									if (missing === 0) return null;
									return (
										<Box
											as='span'
											display='inline-flex'
											alignItems='center'
											justifyContent='center'
											minW='16px'
											h='16px'
											px='1'
											borderRadius='full'
											bg='accent.alert'
											color='fg.onAccent'
											fontSize='10px'
											fontWeight='700'
											fontVariantNumeric='tabular-nums'
											data-tooltip-id='tt-schema-row-description'
											data-tooltip-content='Required schema fields with empty values'
										>
											{missing}
										</Box>
									);
								})()}
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
				{tab === 'headers' && (
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
				{tab === 'url_query' && (
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
