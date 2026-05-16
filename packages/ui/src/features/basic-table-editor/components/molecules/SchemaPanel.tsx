import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import type { ScalarPropertyType, ToggleKeyValue } from '@getbeak/types/request';
import { motion } from 'framer-motion';
import { ChevronDown, ShieldCheck, ShieldOff } from 'lucide-react';
import * as React from 'react';

/**
 * The inline schema panel that drops below a value row when the user
 * expands it via the leading chevron. Lets the user author the contract
 * (type / required / description / options) without losing sight of the
 * value cell above. Replaces the binary Schema/Values toggle mode for
 * headers / query / url-encoded-form rows.
 */

interface SchemaPanelProps {
	item: ToggleKeyValue;
	readOnly?: boolean;
	onChangeType: (next: ScalarPropertyType | null) => void;
	onChangeRequired: (next: boolean | null) => void;
	onChangeDescription: (next: string | null) => void;
	onChangeOptions: (next: string[] | null) => void;
}

const TYPE_OPTIONS: { key: ScalarPropertyType; label: string; hint: string }[] = [
	{ key: 'string', label: 'String', hint: 'Any text value' },
	{ key: 'number', label: 'Number', hint: 'Numeric value' },
	{ key: 'boolean', label: 'Boolean', hint: 'true / false' },
	{ key: 'enum', label: 'Enum', hint: 'One of an explicit list' },
	{ key: 'token', label: 'Token', hint: 'Secret — masked in value mode' },
];

const ChakraButton = chakra('button');

const MotionPanel = motion.create(
	chakra('div', {
		base: {
			gridColumn: '1 / -1',
			borderBottomWidth: '1px',
			borderColor: 'border.subtle',
			overflow: 'hidden',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 4%, transparent)',
		},
	}),
);

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
					h='22px'
					px='2'
					borderRadius='sm'
					borderWidth='1px'
					borderColor='border.subtle'
					bg='bg.surface'
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
		gap='1'
		h='22px'
		px='2'
		borderRadius='full'
		borderWidth='1px'
		borderColor={value ? 'accent.indigo' : 'border.subtle'}
		bg={value ? 'color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)' : 'transparent'}
		color={value ? 'accent.indigo' : 'fg.subtle'}
		fontSize='11px'
		fontWeight='500'
		cursor={disabled ? 'default' : 'pointer'}
		transition='color .12s ease, background-color .12s ease, border-color .12s ease'
		_hover={disabled ? undefined : { color: value ? 'accent.indigo' : 'fg.default' }}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 30%, transparent)',
		}}
	>
		{value ? <ShieldCheck size={11} strokeWidth={2} /> : <ShieldOff size={11} strokeWidth={1.6} />}
		<Box as='span'>{value ? 'Required' : 'Optional'}</Box>
	</ChakraButton>
);

const SchemaPanel: React.FC<SchemaPanelProps> = ({
	item,
	readOnly,
	onChangeType,
	onChangeRequired,
	onChangeDescription,
	onChangeOptions,
}) => {
	const type: ScalarPropertyType = item.type ?? 'string';
	const required = item.required === true;
	const description = item.description ?? '';
	const options = item.options ?? [];

	return (
		<MotionPanel
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			exit={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
		>
			<Flex direction='column' gap='2' px='4' py='3' pl='52px'>
				<Flex align='center' gap='2' wrap='wrap'>
					<Flex align='center' gap='1.5'>
						<Box
							as='span'
							fontSize='10px'
							fontWeight='600'
							color='fg.subtle'
							letterSpacing='0.05em'
							textTransform='uppercase'
						>
							{'Type'}
						</Box>
						<TypeButton value={type} disabled={readOnly} onChange={next => onChangeType(next === 'string' ? null : next)} />
					</Flex>
					<Box w='1px' h='14px' bg='border.subtle' />
					<RequiredToggle value={required} disabled={readOnly} onChange={next => onChangeRequired(next || null)} />
				</Flex>
				<Flex align='center' gap='2'>
					<Box
						as='span'
						fontSize='10px'
						fontWeight='600'
						color='fg.subtle'
						letterSpacing='0.05em'
						textTransform='uppercase'
						minW='80px'
					>
						{'Description'}
					</Box>
					<Box flex='1' borderWidth='1px' borderColor='border.subtle' borderRadius='sm' bg='bg.surface'>
						<DebouncedInput
							type='text'
							value={description}
							disabled={readOnly}
							placeholder='What is this for?'
							onChange={v => onChangeDescription(v || null)}
						/>
					</Box>
				</Flex>
				{type === 'enum' && (
					<Flex align='center' gap='2'>
						<Box
							as='span'
							fontSize='10px'
							fontWeight='600'
							color='fg.subtle'
							letterSpacing='0.05em'
							textTransform='uppercase'
							minW='80px'
						>
							{'Options'}
						</Box>
						<Box flex='1' borderWidth='1px' borderColor='border.subtle' borderRadius='sm' bg='bg.surface'>
							<DebouncedInput
								type='text'
								value={options.join(', ')}
								disabled={readOnly}
								placeholder='Comma-separated allowed values (e.g. free, pro, enterprise)'
								onChange={v => {
									const parsed = v
										.split(',')
										.map(s => s.trim())
										.filter(s => s.length > 0);
									onChangeOptions(parsed.length === 0 ? null : parsed);
								}}
							/>
						</Box>
					</Flex>
				)}
			</Flex>
		</MotionPanel>
	);
};

export default SchemaPanel;
