import type { EditorMode } from '@beak/ui/features/graphql-editor/types';
import { editorTabSubItems } from '@beak/ui/features/graphql-editor/utils';
import { glassChakraProps } from '@beak/ui/lib/glass';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import type { RequestBodyType } from '@getbeak/types/request';
import { Braces, ChevronDown, FileJson, FileText, Hash, type LucideIcon, Network, Type } from 'lucide-react';
import * as React from 'react';

interface BodyTypeSelectorProps {
	value: RequestBodyType;
	graphQlMode: EditorMode;
	onTypeChange: (type: RequestBodyType) => void;
	onGraphQlModeChange: (mode: EditorMode) => void;
}

interface Variant {
	key: RequestBodyType;
	label: string;
	icon: LucideIcon;
	/**
	 * Whether this body type supports schema authoring (per-field required /
	 * type / description). Surfaced as a "schema" pill in the dropdown so the
	 * user knows at-a-glance which types let the contract sit on the body.
	 * Opaque types (text / json_raw / file) carry the bytes through as-is.
	 */
	hasSchema: boolean;
}

const VARIANTS: Variant[] = [
	{ key: 'text', label: 'Text', icon: Type, hasSchema: false },
	{ key: 'json', label: 'JSON', icon: Braces, hasSchema: true },
	{ key: 'json_raw', label: 'JSON (raw)', icon: FileJson, hasSchema: false },
	{ key: 'url_encoded_form', label: 'Form', icon: Network, hasSchema: true },
	{ key: 'graphql', label: 'GraphQL', icon: Hash, hasSchema: true },
	{ key: 'file', label: 'File', icon: FileText, hasSchema: false },
];

const ChakraButton = chakra('button');

const BodyTypeSelector: React.FC<BodyTypeSelectorProps> = ({
	value,
	graphQlMode,
	onTypeChange,
	onGraphQlModeChange,
}) => {
	const active = VARIANTS.find(v => v.key === value);
	const ActiveIcon = active?.icon ?? Type;
	const activeLabel = active?.label ?? value;
	const graphQlSubLabel = editorTabSubItems.find(s => s.key === graphQlMode)?.label ?? graphQlMode;

	return (
		<Flex align='center' gap='1'>
			{value === 'graphql' && (
				<Menu.Root>
					<Menu.Trigger asChild>
						<ChakraButton
							type='button'
							display='inline-flex'
							alignItems='center'
							gap='1'
							h='22px'
							px='2'
							borderRadius='sm'
							borderWidth='1px'
							borderColor='border.subtle'
							bg='transparent'
							color='fg.muted'
							fontSize='11px'
							fontWeight='500'
							cursor='pointer'
							transition='border-color .12s ease, color .12s ease, background-color .12s ease'
							_hover={{
								borderColor: 'accent.pink',
								color: 'accent.pink',
								bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
							}}
							_focusVisible={{
								outline: 'none',
								borderColor: 'accent.pink',
								boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
							}}
						>
							<Box as='span'>{graphQlSubLabel}</Box>
							<ChevronDown size={10} strokeWidth={2.2} style={{ opacity: 0.7 }} />
						</ChakraButton>
					</Menu.Trigger>
					<Portal>
						<Menu.Positioner>
							<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='140px'>
								{editorTabSubItems.map(s => {
									const isActive = s.key === graphQlMode;
									return (
										<Menu.Item
											key={s.key}
											value={s.key}
											onClick={() => onGraphQlModeChange(s.key)}
											fontSize='xs'
											fontWeight={isActive ? '600' : '500'}
											borderRadius='md'
											py='1.5'
											px='2'
											bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : undefined}
											color={isActive ? 'accent.pink' : 'fg.default'}
											_hover={{
												bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
												color: 'accent.pink',
											}}
										>
											{s.label}
										</Menu.Item>
									);
								})}
							</Menu.Content>
						</Menu.Positioner>
					</Portal>
				</Menu.Root>
			)}

			<Menu.Root>
				<Menu.Trigger asChild>
					<ChakraButton
						type='button'
						aria-label={`Body type: ${activeLabel}`}
						title={`Body type: ${activeLabel}`}
						display='inline-flex'
						alignItems='center'
						gap='1.5'
						h='24px'
						px='2'
						borderRadius='sm'
						border='none'
						bg='transparent'
						color='fg.muted'
						fontSize='11.5px'
						fontWeight='500'
						cursor='pointer'
						transition='color .12s ease, background-color .12s ease'
						_hover={{
							color: 'fg.default',
							bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							color: 'accent.pink',
							boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
						}}
						css={{
							'&[data-state="open"]': {
								color: 'var(--beak-colors-accent-pink)',
								background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
							},
							'&[data-state="open"] svg.lucide-chevron-down': { transform: 'rotate(180deg)' },
							'svg.lucide-chevron-down': { transition: 'transform .16s cubic-bezier(0.16, 1, 0.3, 1)' },
						}}
					>
						<ActiveIcon size={11} strokeWidth={1.8} />
						<Box as='span'>{activeLabel}</Box>
						<ChevronDown size={11} strokeWidth={1.8} style={{ opacity: 0.6 }} />
					</ChakraButton>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='160px'>
							{VARIANTS.map(v => {
								const isActive = v.key === value;
								const Icon = v.icon;
								return (
									<Menu.Item
										key={v.key}
										value={v.key}
										onClick={() => onTypeChange(v.key)}
										fontSize='12px'
										fontWeight={isActive ? '600' : '500'}
										borderRadius='sm'
										py='1.5'
										px='2'
										gap='2'
										bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : undefined}
										color={isActive ? 'accent.pink' : 'fg.default'}
										_hover={{
											bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
										}}
									>
										<Icon size={12} strokeWidth={1.8} />
										<Box as='span' flex='1'>
											{v.label}
										</Box>
										{v.hasSchema && (
											<Box
												as='span'
												ml='auto'
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
												title='Schema-aware — required / type / description metadata persists with the body'
											>
												{'schema'}
											</Box>
										)}
									</Menu.Item>
								);
							})}
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>
		</Flex>
	);
};

export default BodyTypeSelector;
