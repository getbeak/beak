import type { SidebarVariant } from '@beak/common/types/beak-hub';
import BeakTooltip from '@beak/ui/components/atoms/BeakTooltip';
import type { Shortcuts } from '@beak/ui/lib/keyboard-shortcuts';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { Box, Flex } from '@chakra-ui/react';
import { FolderTree, type LucideIcon, Plug, Puzzle, Table } from 'lucide-react';
import * as React from 'react';

const icons: Record<SidebarVariant, LucideIcon> = {
	project: FolderTree,
	variables: Table,
	schemas: Plug,
	extensions: Puzzle,
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
		<Box position='relative' h='48px'>
			{isActive && <Box position='absolute' left='0' top='0' bottom='0' w='2px' bg='accent.pink' pointerEvents='none' />}
			<BeakTooltip content={`${name} (${renderPlainTextDefinition(shortcut)})`}>
				<Flex
					role='button'
					tabIndex={0}
					aria-label={name}
					aria-pressed={isActive}
					align='center'
					justify='center'
					cursor='pointer'
					h='100%'
					w='100%'
					color={isActive ? 'fg.default' : 'fg.muted'}
					transition='color .1s linear, background-color .1s linear'
					_hover={{
						color: 'fg.default',
						bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 7%, transparent)',
					}}
					_focusVisible={{
						outline: 'none',
						boxShadow: 'inset 0 0 0 1px var(--beak-colors-accent-pink)',
					}}
					onClick={() => onClick(item)}
					onKeyDown={(event: React.KeyboardEvent) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							onClick(item);
						}
					}}
				>
					<Icon color='currentColor' size={22} strokeWidth={1.6} />
				</Flex>
			</BeakTooltip>
		</Box>
	);
};

export default SidebarMenuItem;
