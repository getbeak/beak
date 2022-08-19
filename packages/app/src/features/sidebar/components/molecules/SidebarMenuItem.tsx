import React, { useContext } from 'react';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { PlatformAgnosticDefinitions, PlatformSpecificDefinitions } from '@beak/app/lib/keyboard-shortcuts/types';
import { renderPlainTextDefinition } from '@beak/app/utils/keyboard-rendering';
import { SidebarVariant } from '@beak/common/types/beak-hub';
import { faTable, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faFolderTree } from '@fortawesome/free-solid-svg-icons/faFolderTree';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

const icons: Record<SidebarVariant, IconDefinition> = {
	project: faFolderTree,
	variables: faTable,
};

interface SidebarMenuItemProps {
	item: SidebarVariant;
	name: string;
	selectedItem: SidebarVariant | null;
	shortcutDefinition: PlatformAgnosticDefinitions | PlatformSpecificDefinitions;
	onClick: (variant: SidebarVariant) => void;
}

const SidebarMenuItem: React.FC<React.PropsWithChildren<SidebarMenuItemProps>> = props => {
	const theme = useTheme();
	const { item, name, selectedItem, shortcutDefinition, onClick } = props;
	const active = item === selectedItem;
	const windowContext = useContext(WindowSessionContext)!;
	const definition = (() => {
		if (shortcutDefinition.type === 'agnostic')
			return shortcutDefinition;

		return shortcutDefinition[windowContext.getPlatform()];
	})();

	return (
		<abbr title={`${name} sidebar (${renderPlainTextDefinition(definition)})`}>
			<Container
				$active={active}
				onClick={() => onClick(item)}
			>
				<FontAwesomeIcon
					icon={icons[item]}
					color={theme.ui.textOnSurfaceBackground}
					fontSize={'14px'}
				/>
			</Container>
		</abbr>
	);
};

export default SidebarMenuItem;

const Container = styled.div<{ $active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;

	cursor: pointer;
	height: 40px;
`;
