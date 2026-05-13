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
	const { item, name, shortcut, onClick } = props;
	const Icon = icons[item];

	return (
		<Box
			textDecoration='underline'
			textDecorationStyle='dotted'
			data-tooltip-id='tt-sidebar-menu-item'
			data-tooltip-content={`${name} (${renderPlainTextDefinition(shortcut)})`}
		>
			<Flex align='center' justify='center' cursor='pointer' h='10' onClick={() => onClick(item)}>
				<Icon color='var(--beak-colors-fg-default)' size={14} />
			</Flex>
		</Box>
	);
};

export default SidebarMenuItem;
