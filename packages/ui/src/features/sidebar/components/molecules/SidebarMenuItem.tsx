import { Box, Flex } from '@chakra-ui/react';
import type { SidebarVariant } from '@beak/common/types/beak-hub';
import type { Shortcuts } from '@beak/ui/lib/keyboard-shortcuts';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { FolderTree, type LucideIcon, Table } from 'lucide-react';
import * as React from 'react';

const icons: Record<SidebarVariant, LucideIcon> = {
	project: FolderTree,
	variables: Table,
};

interface SidebarMenuItemProps {
	item: SidebarVariant;
	name: string;
	selectedItem: SidebarVariant | null;
	shortcut: Shortcuts;
	onClick: (variant: SidebarVariant) => void;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = props => {
	const { item, name, selectedItem, shortcut, onClick } = props;
	const Icon = icons[item];
	const isActive = selectedItem === item;

	return (
		<Box
			data-tooltip-id='tt-sidebar-menu-item'
			data-tooltip-content={`${name} (${renderPlainTextDefinition(shortcut)})`}
			position='relative'
			py='1'
		>
			<Flex
				role='button'
				tabIndex={0}
				aria-label={name}
				aria-pressed={isActive}
				align='center'
				justify='center'
				cursor='pointer'
				h='32px'
				w='32px'
				mx='auto'
				borderRadius='md'
				color={isActive ? 'accent.pink' : 'fg.muted'}
				bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : 'transparent'}
				borderWidth='1px'
				borderStyle='solid'
				borderColor={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)' : 'transparent'}
				boxShadow={isActive ? '0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)' : undefined}
				transition='color .14s ease, background-color .14s ease, transform .08s ease, box-shadow .14s ease'
				_hover={{
					color: 'accent.pink',
					bg: isActive
						? 'color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)'
						: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					boxShadow: isActive
						? '0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent), 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)'
						: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)',
				}}
				_active={{ transform: 'scale(0.92)' }}
				onClick={() => onClick(item)}
				onKeyDown={(event: React.KeyboardEvent) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						onClick(item);
					}
				}}
			>
				<Icon color='currentColor' size={15} strokeWidth={isActive ? 2.2 : 1.8} />
			</Flex>
		</Box>
	);
};

export default SidebarMenuItem;
