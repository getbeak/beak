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
		>
			<Flex
				align='center'
				justify='center'
				cursor='pointer'
				h='10'
				color={isActive ? 'accent.pink' : 'fg.muted'}
				transition='color .14s ease, background-color .14s ease, transform .08s ease'
				_hover={{
					color: isActive ? 'accent.pink' : 'fg.default',
					bg: isActive
						? undefined
						: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)',
				}}
				_active={{ transform: 'scale(0.92)' }}
				onClick={() => onClick(item)}
			>
				<Icon color='currentColor' size={14} />
			</Flex>
		</Box>
	);
};

export default SidebarMenuItem;
