import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, Button, chakra, Flex, Text } from '@chakra-ui/react';
import type { ScalarPropertyType, ToggleKeyValue } from '@getbeak/types/request';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, Plus } from 'lucide-react';
import * as React from 'react';

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

import VariableInput from '../../variable-input/components/VariableInput';
import {
	BodyAction,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyPrimaryCell,
	BodyToggleCell,
	HeaderAction,
	HeaderKeyCell,
	HeaderToggleCell,
	HeaderValueCell,
} from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import EntryActions from './molecules/EntryActions';
import EntryToggler from './molecules/EntryToggler';

interface BasicTableEditorProps {
	items: Record<string, ToggleKeyValue>;
	requestId?: string;
	readOnly?: boolean;
	disableItemToggle?: boolean;
	addItem?: () => void;
	updateItem?: (type: keyof ToggleKeyValue, ident: string, value: string | boolean | ValueSections) => void;
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
				title={checked ? 'Currently true — click to flip' : indeterminate ? 'Currently unset — click to set' : 'Currently false — click to flip'}
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
			{!options.includes(value) && value !== '' && (
				<option value={value}>{`${value} (off-list)`}</option>
			)}
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

const BasicTableEditor: React.FC<BasicTableEditorProps> = ({
	items,
	requestId,
	readOnly,
	disableItemToggle,
	addItem,
	updateItem,
	removeItem,
}) => {
	const editable = !readOnly;
	const showToggle = !disableItemToggle;
	const keys = TypedObject.keys(items);
	const hasRows = keys.length > 0;

	return (
		<Flex direction='column' h='100%' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
			{hasRows && (
				<Header>
					<Row data-empty='true'>
						<HeaderToggleCell />
						<HeaderKeyCell>{'Key'}</HeaderKeyCell>
						<HeaderValueCell>{'Value'}</HeaderValueCell>
						{editable && <HeaderAction />}
					</Row>
				</Header>
			)}
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
						const tooltipAttrs: Record<string, string> = {};
						if (description) {
							tooltipAttrs['data-tooltip-id'] = 'tt-schema-row-description';
							tooltipAttrs['data-tooltip-content'] = description;
						}
						// Enum dropdown is driven from the first part of the value sections
						// — multi-part variable values aren't representable as a single
						// select entry, so we collapse and warn (the "off-list" option).
						const enumOptions = type === 'enum' ? item.options ?? [] : [];
						const useEnumPicker = type === 'enum' && enumOptions.length > 0;
						const enumValue =
							useEnumPicker && item.value.length === 1 && typeof item.value[0] === 'string'
								? item.value[0]
								: '';
						// Boolean toggle is used when the value is purely literal — a single
						// string part the toggle can flip between. If the value carries a
						// variable blob, fall back to the free-text input so the user
						// keeps their reference.
						const useBoolToggle =
							type === 'boolean' &&
							(item.value.length === 0 ||
								(item.value.length === 1 && typeof item.value[0] === 'string'));

						return (
							<MotionRow
								key={k}
								layout
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.16, ease: 'easeOut' }}
								data-missing-required={missingRequired ? 'true' : undefined}
								css={{
									'&[data-missing-required="true"]::before': {
										opacity: 1,
										backgroundColor: 'var(--beak-colors-accent-alert)',
									},
								}}
							>
								<BodyToggleCell>
									{editable && showToggle && (
										<EntryToggler value={item.enabled} onChange={enabled => updateItem?.('enabled', k, enabled)} />
									)}
								</BodyToggleCell>
								<BodyPrimaryCell>
									<BodyInputWrapper {...tooltipAttrs}>
										<DebouncedInput
											type='text'
											value={item.name}
											disabled={readOnly}
											placeholder='key'
											onChange={v => updateItem?.('name', k, v)}
										/>
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
						);
					})}
				</AnimatePresence>

				{!hasRows && (
					<Flex flex='1' align='center' justify='center' direction='column' gap='3' color='fg.subtle'>
						<Flex
							align='center'
							justify='center'
							w='32px'
							h='32px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)'
							color='fg.subtle'
						>
							<Plus size={14} strokeWidth={1.8} />
						</Flex>
						<Text fontSize='sm' fontWeight='500' color='fg.muted'>
							{readOnly ? 'No entries' : 'No entries yet'}
						</Text>
						{editable && (
							<Button
								size='xs'
								variant='outline'
								borderColor='border.default'
								color='fg.default'
								gap='1'
								fontSize='xs'
								fontWeight='500'
								_hover={{
									borderColor: 'accent.pink',
									color: 'accent.pink',
									bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
								}}
								onClick={() => addItem?.()}
							>
								<Plus size={11} strokeWidth={2} />
								{'Add your first row'}
							</Button>
						)}
					</Flex>
				)}
			</Body>

			{hasRows && editable && (
				<Flex justify='flex-end' mt='2' mb='2' mr='2'>
					<Button
						bg='transparent'
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='sm'
						color='fg.muted'
						gap='1'
						px='2.5'
						py='1'
						fontSize='xs'
						fontWeight='500'
						h='auto'
						minH='24px'
						transition='border-color .1s linear, background-color .1s linear, color .1s linear'
						_hover={{
							outline: 'none',
							borderColor: 'color-mix(in srgb, var(--beak-colors-fg-default) 25%, transparent)',
							color: 'fg.default',
							bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							borderColor: 'accent.pink',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
						}}
						onClick={() => addItem?.()}
					>
						<Plus size={11} strokeWidth={2} />
						{'Add row'}
					</Button>
				</Flex>
			)}
		</Flex>
	);
};

export default BasicTableEditor;
