import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { ScalarPropertyType, ToggleKeyValue } from '@getbeak/types/request';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import VariableInput from '../../variable-input/components/VariableInput';
import type { HeaderSuggestion } from '../constants/common-headers';
import {
	BodyAction,
	BodyExpandCell,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyPrimaryCell,
	BodyToggleCell,
	HeaderAction,
	HeaderExpandCell,
	HeaderKeyCell,
	HeaderToggleCell,
	HeaderValueCell,
} from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import CookieHeaderEditor from './molecules/CookieHeaderEditor';
import EntryActions from './molecules/EntryActions';
import EntryToggler from './molecules/EntryToggler';
import SchemaPanel from './molecules/SchemaPanel';
import SuggestingNameInput from './molecules/SuggestingNameInput';

/**
 * A `ValueSections` is "effectively empty" when it has no parts, or every
 * part is an empty string (variables are never empty — their presence
 * means a value will resolve at flight time). Used by schema-driven
 * validation to flag required-but-blank rows.
 */
function isValueEmpty(parts: ValueSections | undefined): boolean {
	if (!parts || parts.length === 0) return true;
	return parts.every(p => typeof p === 'string' && p.length === 0);
}

/**
 * A row has "schema authored" when any of the optional schema fields has
 * been set. The expand chevron tints indigo in that state so the user can
 * scan the table for which rows already have a contract attached.
 */
function hasSchemaAuthored(item: ToggleKeyValue): boolean {
	return (
		(item.type !== undefined && item.type !== 'string') ||
		item.required === true ||
		(item.description !== undefined && item.description.length > 0) ||
		(item.options !== undefined && item.options.length > 0)
	);
}

interface BasicTableEditorProps {
	items: Record<string, ToggleKeyValue>;
	requestId?: string;
	readOnly?: boolean;
	disableItemToggle?: boolean;
	/**
	 * When set, the key cell renders a typeahead-style input that suggests
	 * names from this list as the user types. The input still accepts
	 * arbitrary free text — suggestions are guidance, not validation. Used
	 * by the request-pane headers tab to surface RFC header names.
	 */
	nameSuggestions?: HeaderSuggestion[];
	addItem?: () => void;
	/**
	 * Update a row's field. Accepts the legacy value-mode fields (name /
	 * value / enabled) and the schema fields (type / required / description /
	 * options). Reducer-side, schema fields use `null` to clear.
	 */
	updateItem?: (
		type: keyof ToggleKeyValue,
		ident: string,
		value: string | boolean | ValueSections | ScalarPropertyType | string[] | null,
	) => void;
	removeItem?: (ident: string) => void;
}

const MotionRow = motion.create(Row);

const ChakraSelect = chakra('select');
const ChakraToggleButton = chakra('button');

/**
 * Native-feel boolean switch for `type='boolean'` value cells. Reads + writes
 * the value as `['true']` / `['false']` / `['']` so the legacy wire format
 * keeps working — a variable reference would put non-string parts in the
 * ValueSections and we fall back to the free-text VariableInput.
 */
const BoolValueToggle: React.FC<{
	value: ValueSections;
	disabled?: boolean;
	onChange: (next: ValueSections) => void;
}> = ({ value, disabled, onChange }) => {
	const literal = value.length === 1 && typeof value[0] === 'string' ? value[0] : '';
	const checked = literal === 'true';
	const indeterminate = literal !== 'true' && literal !== 'false';
	return (
		<Flex flexGrow={1} align='center' gap='2' pl='10px'>
			<ChakraToggleButton
				type='button'
				role='switch'
				aria-checked={checked}
				disabled={disabled}
				title={
					checked
						? 'Currently true — click to flip'
						: indeterminate
							? 'Currently unset — click to set'
							: 'Currently false — click to flip'
				}
				onClick={() => onChange([checked ? 'false' : 'true'])}
				position='relative'
				w='30px'
				h='16px'
				minW='30px'
				p='0'
				borderRadius='full'
				borderWidth='1px'
				borderColor={checked ? 'accent.pink' : indeterminate ? 'border.subtle' : 'border.emphasized'}
				bg={
					checked
						? 'accent.pink'
						: indeterminate
							? 'transparent'
							: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 70%, transparent)'
				}
				cursor={disabled ? 'default' : 'pointer'}
				transition='background-color .18s ease, border-color .18s ease'
				_focusVisible={{
					outline: 'none',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
				}}
			>
				<Box
					position='absolute'
					top='1px'
					left='1px'
					w='12px'
					h='12px'
					borderRadius='full'
					bg={checked ? 'fg.onAccent' : indeterminate ? 'fg.subtle' : 'fg.muted'}
					transform={checked ? 'translateX(14px)' : indeterminate ? 'translateX(7px)' : 'translateX(0)'}
					transition='transform .2s cubic-bezier(.4, 0, .2, 1), background-color .18s ease'
				/>
			</ChakraToggleButton>
			<Box as='span' fontSize='11.5px' color={indeterminate ? 'fg.subtle' : 'fg.muted'} fontVariantNumeric='tabular-nums'>
				{indeterminate ? 'unset' : literal}
			</Box>
		</Flex>
	);
};

/**
 * Native-styled select dropdown for enum-typed values. Native `<select>` keeps
 * keyboard navigation + accessibility for free; the chrome rides Beak's
 * tokens so it doesn't look out of place next to the variable input.
 */
const EnumSelect: React.FC<{
	options: string[];
	value: string;
	disabled?: boolean;
	onChange: (next: string) => void;
}> = ({ options, value, disabled, onChange }) => (
	<Box position='relative' flexGrow={1} display='inline-flex' alignItems='stretch'>
		<ChakraSelect
			value={value}
			disabled={disabled}
			onChange={e => onChange((e.target as HTMLSelectElement).value)}
			w='100%'
			h='30px'
			minH='30px'
			px='10px'
			pr='28px'
			borderWidth='0'
			borderRadius='0'
			bg='transparent'
			color='fg.default'
			fontSize='12px'
			fontFamily='inherit'
			appearance='none'
			cursor={disabled ? 'default' : 'pointer'}
			outline='none'
			_focus={{
				bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 5%, transparent)',
				boxShadow: 'inset 0 -1px 0 var(--beak-colors-accent-pink)',
			}}
		>
			{!options.includes(value) && value !== '' && <option value={value}>{`${value} (off-list)`}</option>}
			{value === '' && <option value=''>{'Choose a value…'}</option>}
			{options.map(o => (
				<option key={o} value={o}>
					{o}
				</option>
			))}
		</ChakraSelect>
		<Box
			position='absolute'
			right='8px'
			top='50%'
			transform='translateY(-50%)'
			pointerEvents='none'
			color='fg.subtle'
			display='inline-flex'
			alignItems='center'
		>
			<ChevronDown size={12} strokeWidth={1.8} />
		</Box>
	</Box>
);

/**
 * Tiny indicator that the schema declared this field required. Pink dot,
 * tooltip on hover ("Required by schema"). Sits at the leading edge of
 * the key cell so it scans as "this field has a contract obligation"
 * without stealing real estate.
 */
const RequiredDot: React.FC = () => (
	<Box
		flexShrink={0}
		w='5px'
		h='5px'
		ml='1.5'
		borderRadius='full'
		bg='accent.pink'
		data-tooltip-id='tt-schema-row-description'
		data-tooltip-content='Required by schema'
	/>
);

/**
 * Type chip rendered next to the input when the schema declared a non-string
 * type. Tiny indigo capsule — visible enough to communicate the contract,
 * faint enough not to compete with the value.
 */
const TypeChip: React.FC<{ type: ScalarPropertyType }> = ({ type }) => (
	<Box
		flexShrink={0}
		mr='1.5'
		px='1.5'
		h='14px'
		display='inline-flex'
		alignItems='center'
		borderRadius='sm'
		bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
		color='accent.indigo'
		fontSize='9.5px'
		fontWeight='600'
		letterSpacing='0.04em'
		textTransform='uppercase'
	>
		{type}
	</Box>
);

const ChakraExpandButton = chakra('button');

const BasicTableEditor: React.FC<BasicTableEditorProps> = ({
	items,
	requestId,
	readOnly,
	disableItemToggle,
	nameSuggestions,
	addItem,
	updateItem,
	removeItem,
}) => {
	const editable = !readOnly;
	const showToggle = !disableItemToggle;
	const keys = TypedObject.keys(items);
	const hasRows = keys.length > 0;
	// Per-row expanded state. Local to this editor instance — schema authoring
	// is transient UI; if the user closes and re-opens the request the panel
	// starts collapsed (the schema info is still visible via the value-mode
	// row affordances: required dot, type chip, description tooltip).
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	// Track keys across renders so we can spot the just-added row and pull
	// focus into its key input. Avoids the "click + then click the key cell"
	// dance after hitting the trailing "+ Add row" stub.
	const previousKeysRef = useRef<string[]>(keys);
	const focusKeyRef = useRef<string | null>(null);
	useEffect(() => {
		const prev = previousKeysRef.current;
		if (keys.length > prev.length) {
			const added = keys.find(k => !prev.includes(k));
			if (added) focusKeyRef.current = added;
		}
		previousKeysRef.current = keys;
	}, [keys]);

	return (
		<Flex direction='column' h='100%' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
			<Header>
				<Row data-empty='true'>
					<HeaderExpandCell />
					<HeaderToggleCell />
					<HeaderKeyCell>{'Key'}</HeaderKeyCell>
					<HeaderValueCell>{'Value'}</HeaderValueCell>
					{editable && <HeaderAction />}
				</Row>
			</Header>
			<Body flex='1' display='flex' flexDirection='column' minH={0}>
				<AnimatePresence initial={false}>
					{keys.map(k => {
						const item = items[k];
						const required = item.required === true;
						const enabled = item.enabled !== false;
						const type = item.type;
						const description = item.description;
						const showTypeChip = type !== undefined && type !== 'string';
						const missingRequired = required && enabled && isValueEmpty(item.value);
						// Empty-key rows are silently dropped at the prepare-request
						// boundary; flag them in the editor so the user notices the
						// row that won't actually be sent. Disabled rows aren't sent
						// anyway, so skip the flag for them.
						const emptyKey = enabled && (!item.name || item.name.trim().length === 0);
						const tooltipAttrs: Record<string, string> = {};
						if (description) {
							tooltipAttrs['data-tooltip-id'] = 'tt-schema-row-description';
							tooltipAttrs['data-tooltip-content'] = description;
						}
						// Enum dropdown is driven from the first part of the value sections
						// — multi-part variable values aren't representable as a single
						// select entry, so we collapse and warn (the "off-list" option).
						const enumOptions = type === 'enum' ? (item.options ?? []) : [];
						const useEnumPicker = type === 'enum' && enumOptions.length > 0;
						const enumValue =
							useEnumPicker && item.value.length === 1 && typeof item.value[0] === 'string' ? item.value[0] : '';
						// Boolean toggle is used when the value is purely literal — a single
						// string part the toggle can flip between. If the value carries a
						// variable blob, fall back to the free-text input so the user
						// keeps their reference.
						const useBoolToggle =
							type === 'boolean' &&
							(item.value.length === 0 || (item.value.length === 1 && typeof item.value[0] === 'string'));
						// Cookie rows surface a structured editor for `name=value` pairs
						// instead of the schema authoring panel. Detection is opt-in via
						// `nameSuggestions` — the headers table sets it; the query table
						// doesn't.
						const isCookieRow = Boolean(nameSuggestions) && item.name.trim().toLowerCase() === 'cookie';
						// Cookie rows default to expanded so the structured editor is the
						// first thing the user sees; everything else stays collapsed.
						const isExpanded = expanded[k] !== undefined ? expanded[k] === true : isCookieRow;
						const schemaAuthored = hasSchemaAuthored(item);
						const expandTooltip = isCookieRow
							? isExpanded
								? 'Hide cookie editor'
								: 'Show cookie editor'
							: isExpanded
								? 'Hide schema'
								: schemaAuthored
									? 'Show schema'
									: 'Define schema';
						const expandColor = isCookieRow ? 'accent.pink' : schemaAuthored ? 'accent.indigo' : 'fg.subtle';

						return (
							<React.Fragment key={k}>
								<MotionRow
									layout
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.16, ease: 'easeOut' }}
									data-missing-required={missingRequired ? 'true' : undefined}
									data-empty-key={emptyKey ? 'true' : undefined}
									css={{
										'&[data-missing-required="true"]::before': {
											opacity: 1,
											backgroundColor: 'var(--beak-colors-accent-alert)',
										},
										'&[data-empty-key="true"]': {
											backgroundColor:
												'color-mix(in srgb, var(--beak-colors-accent-warning) 8%, transparent)',
										},
										'&[data-empty-key="true"]::before': {
											opacity: 1,
											backgroundColor: 'var(--beak-colors-accent-warning)',
										},
									}}
								>
									<BodyExpandCell>
										<ChakraExpandButton
											type='button'
											aria-label={isExpanded ? 'Collapse' : 'Expand'}
											aria-expanded={isExpanded}
											title={expandTooltip}
											onClick={() =>
												setExpanded(prev => ({
													...prev,
													[k]: !(prev[k] !== undefined ? prev[k] : isCookieRow),
												}))
											}
											display='inline-flex'
											alignItems='center'
											justifyContent='center'
											w='18px'
											h='18px'
											p='0'
											border='none'
											bg='transparent'
											color={expandColor}
											cursor='pointer'
											transition='color .12s ease, transform .12s ease'
											_hover={{ color: isCookieRow ? 'accent.pink' : schemaAuthored ? 'accent.indigo' : 'fg.default' }}
											_focusVisible={{
												outline: 'none',
												boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 35%, transparent)',
												borderRadius: '4px',
											}}
										>
											{isExpanded ? <ChevronDown size={11} strokeWidth={2} /> : <ChevronRight size={11} strokeWidth={2} />}
										</ChakraExpandButton>
									</BodyExpandCell>
									<BodyToggleCell>
										{editable && showToggle && (
											<EntryToggler value={item.enabled} onChange={enabled => updateItem?.('enabled', k, enabled)} />
										)}
									</BodyToggleCell>
									<BodyPrimaryCell>
										<BodyInputWrapper {...tooltipAttrs}>
											{nameSuggestions ? (
												<SuggestingNameInput
													innerRef={el => {
														if (focusKeyRef.current === k && el) {
															el.focus();
															focusKeyRef.current = null;
														}
													}}
													value={item.name}
													disabled={readOnly}
													placeholder='key'
													suggestions={nameSuggestions}
													onChange={v => updateItem?.('name', k, v)}
												/>
											) : (
												<DebouncedInput
													innerRef={el => {
														if (focusKeyRef.current === k && el) {
															el.focus();
															focusKeyRef.current = null;
														}
													}}
													type='text'
													value={item.name}
													disabled={readOnly}
													placeholder='key'
													onChange={v => updateItem?.('name', k, v)}
												/>
											)}
											{required && <RequiredDot />}
										</BodyInputWrapper>
									</BodyPrimaryCell>
									<BodyInputValueCell>
										<BodyInputWrapper>
											{showTypeChip && type && <TypeChip type={type} />}
											{useEnumPicker ? (
												<EnumSelect
													options={enumOptions}
													value={enumValue}
													disabled={readOnly}
													onChange={next => updateItem?.('value', k, [next])}
												/>
											) : useBoolToggle ? (
												<BoolValueToggle
													value={item.value}
													disabled={readOnly}
													onChange={parts => updateItem?.('value', k, parts)}
												/>
											) : (
												<VariableInput
													requestId={requestId}
													parts={item.value}
													readOnly={readOnly}
													disabled={readOnly}
													mask={type === 'token'}
													onChange={parts => updateItem?.('value', k, parts)}
												/>
											)}
											{missingRequired && (
												<Box
													flexShrink={0}
													mr='2'
													display='inline-flex'
													alignItems='center'
													color='accent.alert'
													data-tooltip-id='tt-schema-row-description'
													data-tooltip-content='Required by schema but the value is empty'
												>
													<AlertCircle size={12} strokeWidth={2} />
												</Box>
											)}
										</BodyInputWrapper>
									</BodyInputValueCell>
									{editable && (
										<BodyAction>
											<EntryActions onRemove={() => removeItem?.(k)} />
										</BodyAction>
									)}
								</MotionRow>
								<AnimatePresence initial={false}>
									{isExpanded && editable && isCookieRow && (
										<CookieHeaderEditor
											key={`${k}-cookie-panel`}
											value={item.value}
											readOnly={readOnly}
											onChange={next => updateItem?.('value', k, next)}
										/>
									)}
									{isExpanded && editable && !isCookieRow && (
										<SchemaPanel
											key={`${k}-panel`}
											item={item}
											readOnly={readOnly}
											onChangeType={next => updateItem?.('type', k, next)}
											onChangeRequired={next => updateItem?.('required', k, next)}
											onChangeDescription={next => updateItem?.('description', k, next)}
											onChangeOptions={next => updateItem?.('options', k, next)}
										/>
									)}
								</AnimatePresence>
							</React.Fragment>
						);
					})}
				</AnimatePresence>

				{editable && <TrailingGhostRow hasRows={hasRows} onAdd={() => addItem?.()} />}
			</Body>
		</Flex>
	);
};

/**
 * Inline call-to-action that sits as the visual "next row" below the real
 * rows. Clicking (or tab-focusing) anywhere on it dispatches an `addItem`;
 * `BasicTableEditor` then focuses the new row's key input so the user can
 * just start typing without a chrome handoff. Replaces the prior bottom-right
 * "Add row" button + the centred empty-state callout — the empty case is
 * just this stub with a slightly louder label.
 */
const TrailingGhostRow: React.FC<{ hasRows: boolean; onAdd: () => void }> = ({ hasRows, onAdd }) => {
	const label = hasRows ? 'Add row' : 'Add your first row';
	return (
		<MotionRow
			layout
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.16, ease: 'easeOut' }}
			role='button'
			tabIndex={0}
			aria-label={label}
			onClick={onAdd}
			onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					onAdd();
				}
			}}
			data-ghost-row='true'
			css={{
				cursor: 'pointer',
				borderBottomStyle: 'dashed',
				color: 'var(--beak-colors-fg-subtle)',
				transition: 'background-color .12s ease, color .12s ease, border-color .12s ease',
				'&:hover': {
					backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 6%, transparent)',
					color: 'var(--beak-colors-accent-pink)',
					borderBottomColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 36%, transparent)',
				},
				'&:focus-visible': {
					outline: 'none',
					backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)',
					color: 'var(--beak-colors-accent-pink)',
					boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent)',
				},
				'&::before': { display: 'none' },
			}}
		>
			<Box
				gridColumn='3 / -1'
				display='inline-flex'
				alignItems='center'
				gap='1.5'
				h='100%'
				pl='10px'
				fontSize='12px'
				fontWeight='500'
				letterSpacing='0.005em'
			>
				<Plus size={11} strokeWidth={2.2} />
				<Box as='span'>{label}</Box>
			</Box>
		</MotionRow>
	);
};

export default BasicTableEditor;
