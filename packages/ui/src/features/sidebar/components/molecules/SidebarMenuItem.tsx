import type { SidebarVariant } from '@beak/common/types/beak-hub';
import type { Shortcuts } from '@beak/ui/lib/keyboard-shortcuts';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { FolderTree, type LucideIcon, Table } from 'lucide-react';
import React from 'react';
import styled from 'styled-components';

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
	const active = item === selectedItem;
	const Icon = icons[item];

	return (
		<FakeAbbr
			data-tooltip-id={'tt-sidebar-menu-item'}
			data-tooltip-content={`${name} (${renderPlainTextDefinition(shortcut)})`}
		>
			<Container $active={active} onClick={() => onClick(item)}>
				<Icon color='var(--beak-colors-fg-default)' size={14} />
			</Container>
		</FakeAbbr>
	);
};

export default SidebarMenuItem;

const FakeAbbr = styled.div`
	text-decoration: underline;
	text-decoration-style: dotted;
`;

const Container = styled.div<{ $active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;

	cursor: pointer;
	height: 40px;
`;
