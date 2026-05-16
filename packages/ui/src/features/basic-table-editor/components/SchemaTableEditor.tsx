import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { Box, Button, chakra, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import type { ScalarPropertyType, ToggleKeyValue } from '@getbeak/types/request';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus, ShieldCheck, ShieldOff } from 'lucide-react';
import * as React from 'react';

import EntryActions from './molecules/EntryActions';

/**
 * Schema-mode counterpart to `BasicTableEditor`. Where the value editor
 * renders Toggle | Key | Value | Action, the schema editor renders:
 *
 *   Required | Key | Type | Description | Action
 *
 * Editing here defines the contract (what the request expects), not the
 * concrete value sent. The required toggle, type picker, and description
 * field all persist via the same `ToggleableItemUpdatedPayload` shape —
 * see `applySchemaMetadata` in the reducer for the three-state semantics
 * (undefined keeps, null clears, value sets).
 */

interface SchemaTableEditorProps {
	items: Record<string, ToggleKeyValue>;
	readOnly?: boolean;
	addItem?: () => void;
	removeItem?: (ident: string) => void;
	updateItem?: (
		key: 'name' | 'type' | 'required' | 'description' | 'options',
		ident: string,
		value: string | boolean | ScalarPropertyType | string[] | null,
	) => void;
}

const TYPE_OPTIONS: { key: ScalarPropertyType; label: string; hint: string }[] = [
	{ key: 'string', label: 'String', hint: 'Any text value' },
	{ key: 'number', label: 'Number', hint: 'Numeric value' },
	{ key: 'boolean', label: 'Boolean', hint: 'true / false' },
	{ key: 'enum', label: 'Enum', hint: 'One of an explicit list' },
	{ key: 'token', label: 'Token', hint: 'Secret — masked in the value editor' },
];

const ChakraButton = chakra('button');

const Row = chakra('div', {
	base: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: '28px minmax(0, .8fr) 96px minmax(0, 1fr) 28px',
		gridTemplateRows: 'minmax(0, 1fr)',
		alignItems: 'stretch',
		minHeight: '32px',
		borderBottomWidth: '1px',
		borderColor: 'border.subtle',
		transition: 'background-color .12s ease',
		'&::before': {
			content: '""',
			position: 'absolute',
			top: 0,
			bottom: 0,
			left: 0,
			width: '2px',
			backgroundColor: 'accent.indigo',
			opacity: 0,
			transition: 'opacity .12s ease',
			pointerEvents: 'none',
		},
		'&:hover': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-fg-default) 4%, transparent)',
		},
		'&:focus-within': {
			backgroundColor: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)',
		},
		'&:hover::before, &:focus-within::before': { opacity: 1 },
		'&:hover [data-row-action], &:focus-within [data-row-action]': { opacity: 1 },
		'&[data-empty="true"]': {
			minHeight: '28px',
		},
		'&[data-empty="true"]:hover, &[data-empty="true"]:focus-within': {
			backgroundColor: 'transparent',
		},
		'&[data-empty="true"]::before': { display: 'none' },
	},
});

const MotionRow = motion.create(Row);

const HeaderCell = chakra('div', {
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-start',
		px: '2',
		fontSize: '10px',
		fontWeight: '600',
		letterSpacing: '0.05em',
		textTransform: 'uppercase',
		color: 'fg.subtle',
	},
});

const BodyCell = chakra('div', {
	base: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-start',
		px: '2',
		minWidth: 0,
	},
});

const TypeButton: React.FC<{
	value: ScalarPropertyType;
	disabled?: boolean;
	onChange: (next: ScalarPropertyType) => void;
}> = ({ value, disabled, onChange }) => {
	const active = TYPE_OPTIONS.find(o => o.key === value) ?? TYPE_OPTIONS[0];
	return (
		<Menu.Root>
			<Menu.Trigger asChild>
				<ChakraButton
					type='button'
					disabled={disabled}
					aria-label={`Type: ${active.label}`}
					title={`Type: ${active.label} — ${active.hint}`}
					display='inline-flex'
					alignItems='center'
					gap='1'
					h='20px'
					px='2'
					borderRadius='sm'
					borderWidth='1px'
					borderColor='border.subtle'
					bg='transparent'
					color='fg.muted'
					fontSize='11px'
					fontWeight='500'
					cursor={disabled ? 'default' : 'pointer'}
					_hover={disabled ? undefined : { borderColor: 'accent.indigo', color: 'accent.indigo' }}
					_focusVisible={{
						outline: 'none',
						borderColor: 'accent.indigo',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 30%, transparent)',
					}}
				>
					<Box as='span'>{active.label}</Box>
					<ChevronDown size={11} strokeWidth={1.8} style={{ opacity: 0.6 }} />
				</ChakraButton>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content
						bg='bg.surface.emphasized'
						borderWidth='1px'
						borderColor='border.default'
						borderRadius='md'
						boxShadow='0 8px 24px rgba(0,0,0,0.28)'
						p='1'
						minW='180px'
					>
						{TYPE_OPTIONS.map(o => {
							const isActive = o.key === value;
							return (
								<Menu.Item
									key={o.key}
									value={o.key}
									onClick={() => onChange(o.key)}
									fontSize='12px'
									fontWeight={isActive ? '600' : '500'}
									borderRadius='sm'
									py='1.5'
									px='2'
									gap='2'
									bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)' : undefined}
									color={isActive ? 'accent.indigo' : 'fg.default'}
									_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)' }}
								>
									<Flex direction='column' align='flex-start'>
										<Box as='span'>{o.label}</Box>
										<Box as='span' fontSize='10.5px' color='fg.subtle' fontWeight='400'>
											{o.hint}
										</Box>
									</Flex>
								</Menu.Item>
							);
						})}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
};

const RequiredToggle: React.FC<{
	value: boolean;
	disabled?: boolean;
	onChange: (next: boolean) => void;
}> = ({ value, disabled, onChange }) => (
	<ChakraButton
		type='button'
		disabled={disabled}
		aria-pressed={value}
		aria-label={value ? 'Required' : 'Optional'}
		title={value ? 'Required field' : 'Optional field'}
		onClick={() => onChange(!value)}
		display='inline-flex'
		alignItems='center'
		justifyContent='center'
		w='22px'
		h='22px'
		borderRadius='full'
		border='none'
		bg={value ? 'color-mix(in srgb, var(--beak-colors-accent-indigo) 16%, transparent)' : 'transparent'}
		color={value ? 'accent.indigo' : 'fg.subtle'}
		cursor={disabled ? 'default' : 'pointer'}
		transition='color .12s ease, background-color .12s ease'
		_hover={disabled ? undefined : { color: value ? 'accent.indigo' : 'fg.default' }}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 30%, transparent)',
		}}
	>
		{value ? <ShieldCheck size={13} strokeWidth={2} /> : <ShieldOff size={13} strokeWidth={1.6} />}
	</ChakraButton>
);

const SchemaTableEditor: React.FC<SchemaTableEditorProps> = ({
	items,
	readOnly,
	addItem,
	updateItem,
	removeItem,
}) => {
	const editable = !readOnly;
	const keys = TypedObject.keys(items);
	const hasRows = keys.length > 0;

	return (
		<Flex direction='column' h='100%' w='100%' fontSize='sm' fontWeight='400' color='fg.muted'>
			{hasRows && (
				<Row data-empty='true'>
					<HeaderCell>{'Req'}</HeaderCell>
					<HeaderCell>{'Key'}</HeaderCell>
					<HeaderCell>{'Type'}</HeaderCell>
					<HeaderCell>{'Description'}</HeaderCell>
					<HeaderCell />
				</Row>
			)}
			<Flex flex='1' direction='column' minH={0}>
				<AnimatePresence initial={false}>
					{keys.map(k => {
						const item = items[k];
						const required = item.required ?? false;
						const type: ScalarPropertyType = item.type ?? 'string';
						const description = item.description ?? '';
						return (
							<MotionRow
								key={k}
								layout
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.16, ease: 'easeOut' }}
							>
								<BodyCell>
									<RequiredToggle
										value={required}
										disabled={readOnly}
										onChange={next => updateItem?.('required', k, next || null)}
									/>
								</BodyCell>
								<BodyCell>
									<DebouncedInput
										type='text'
										value={item.name}
										disabled={readOnly}
										placeholder='key'
										onChange={v => updateItem?.('name', k, v)}
									/>
								</BodyCell>
								<BodyCell>
									<TypeButton
										value={type}
										disabled={readOnly}
										onChange={next => updateItem?.('type', k, next === 'string' ? null : next)}
									/>
								</BodyCell>
								<BodyCell>
									<Flex direction='column' w='100%' gap='0.5' py='1'>
										<DebouncedInput
											type='text'
											value={description}
											disabled={readOnly}
											placeholder='What is this for?'
											onChange={v => updateItem?.('description', k, v || null)}
										/>
										{type === 'enum' && (
											<DebouncedInput
												type='text'
												value={(item.options ?? []).join(', ')}
												disabled={readOnly}
												placeholder='Comma-separated allowed values (e.g. free, pro, enterprise)'
												onChange={v => {
													const parsed = v
														.split(',')
														.map(s => s.trim())
														.filter(s => s.length > 0);
													updateItem?.('options', k, parsed.length === 0 ? null : parsed);
												}}
											/>
										)}
									</Flex>
								</BodyCell>
								{editable && (
									<BodyCell>
										<EntryActions onRemove={() => removeItem?.(k)} />
									</BodyCell>
								)}
							</MotionRow>
						);
					})}
				</AnimatePresence>

				{!hasRows && (
					<Flex flex='1' align='center' justify='center' direction='column' gap='3' color='fg.subtle' py='8'>
						<Flex
							align='center'
							justify='center'
							w='32px'
							h='32px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 12%, transparent)'
							color='accent.indigo'
						>
							<ShieldCheck size={14} strokeWidth={1.8} />
						</Flex>
						<Text fontSize='sm' fontWeight='500' color='fg.muted'>
							{readOnly ? 'No schema entries' : 'Define the contract'}
						</Text>
						<Text fontSize='xs' color='fg.subtle' maxW='260px' textAlign='center'>
							{readOnly
								? 'This request hasn’t declared any expected fields yet.'
								: 'Add named fields with types so values mode can guide what to send.'}
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
									borderColor: 'accent.indigo',
									color: 'accent.indigo',
									bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 10%, transparent)',
								}}
								onClick={() => addItem?.()}
							>
								<Plus size={11} strokeWidth={2} />
								{'Add first field'}
							</Button>
						)}
					</Flex>
				)}
			</Flex>

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
							borderColor: 'accent.indigo',
							color: 'accent.indigo',
							bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 8%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							borderColor: 'accent.indigo',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 22%, transparent)',
						}}
						onClick={() => addItem?.()}
					>
						<Plus size={11} strokeWidth={2} />
						{'Add field'}
					</Button>
				</Flex>
			)}
		</Flex>
	);
};

export default SchemaTableEditor;
