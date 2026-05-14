import { Box, Flex, Menu, Portal, chakra } from '@chakra-ui/react';
import type { EditorMode } from '@beak/ui/features/graphql-editor/types';
import { editorTabSubItems } from '@beak/ui/features/graphql-editor/utils';
import { Braces, ChevronDown, FileText, Hash, Network, Type, type LucideIcon } from 'lucide-react';
import type { RequestBodyType } from '@getbeak/types/request';
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
}

const VARIANTS: Variant[] = [
	{ key: 'text', label: 'Text', icon: Type },
	{ key: 'json', label: 'JSON', icon: Braces },
	{ key: 'url_encoded_form', label: 'Form', icon: Network },
	{ key: 'graphql', label: 'GraphQL', icon: Hash },
	{ key: 'file', label: 'File', icon: FileText },
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
							<Menu.Content
								bg='color-mix(in srgb, var(--beak-colors-bg-surface) 78%, transparent)'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-border-default) 80%, transparent)'
								borderRadius='lg'
								backdropFilter='blur(24px) saturate(180%)'
								boxShadow='0 24px 56px rgba(0,0,0,0.32), 0 8px 18px rgba(0,0,0,0.16), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
								p='1'
								minW='140px'
							>
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
											bg={isActive
												? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
												: undefined}
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
						h='22px'
						px='2'
						borderRadius='sm'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, var(--beak-colors-border-subtle))'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)'
						color='accent.pink'
						fontSize='11px'
						fontWeight='600'
						cursor='pointer'
						transition='border-color .12s ease, background-color .12s ease, box-shadow .12s ease'
						_hover={{
							bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
						}}
					>
						<ActiveIcon size={11} strokeWidth={2} />
						<Box as='span'>{activeLabel}</Box>
						<ChevronDown size={10} strokeWidth={2.2} style={{ opacity: 0.7 }} />
					</ChakraButton>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content
							bg='color-mix(in srgb, var(--beak-colors-bg-surface) 78%, transparent)'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-border-default) 80%, transparent)'
							borderRadius='lg'
							backdropFilter='blur(24px) saturate(180%)'
							boxShadow='0 24px 56px rgba(0,0,0,0.32), 0 8px 18px rgba(0,0,0,0.16), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
							p='1'
							minW='150px'
						>
							{VARIANTS.map(v => {
								const isActive = v.key === value;
								const Icon = v.icon;
								return (
									<Menu.Item
										key={v.key}
										value={v.key}
										onClick={() => onTypeChange(v.key)}
										fontSize='xs'
										fontWeight={isActive ? '600' : '500'}
										borderRadius='md'
										py='1.5'
										px='2'
										gap='2'
										bg={isActive
											? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
											: undefined}
										color={isActive ? 'accent.pink' : 'fg.default'}
										_hover={{
											bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
											color: 'accent.pink',
										}}
									>
										<Icon size={12} strokeWidth={2} />
										<Box as='span'>{v.label}</Box>
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
