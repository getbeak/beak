import { Box } from '@chakra-ui/react';
import * as React from 'react';

import TabItemSubItemsDropdown from './TabItemSubItemsDropdown';

export interface TabSubItem<T = string> {
	key: T;
	label: string;
}

export interface TabItemProps<T = string> extends Omit<React.HTMLProps<HTMLDivElement>, 'size'> {
	active?: boolean;
	activeSubItem?: string;
	lazyForwardedRef?: React.LegacyRef<HTMLDivElement>;
	size?: 'sm' | 'md';
	subItems?: TabSubItem<T>[];
	onSubItemChanged?: (subItem: T) => void;
}

const TabItem = <T = string>(props: React.PropsWithChildren<TabItemProps<T>>): React.ReactElement => {
	const { active, activeSubItem, children, lazyForwardedRef, onSubItemChanged, size, subItems, ...rest } = props;

	const sm = size === 'sm';

	return (
		<Box
			ref={lazyForwardedRef as unknown as React.Ref<HTMLDivElement>}
			display='flex'
			borderBottomWidth='1px'
			borderBottomStyle='solid'
			borderBottomColor={active ? 'accent.pink' : 'border.default'}
			color={active ? 'accent.pink' : 'fg.muted'}
			fontSize={sm ? 'sm' : 'md'}
			px={sm ? '1.5' : '2.5'}
			py={sm ? '1' : '1.5'}
			cursor='pointer'
			whiteSpace='nowrap'
			transition='color .12s ease, border-bottom-color .12s ease'
			_hover={
				active
					? undefined
					: { color: 'fg.default', borderBottomColor: 'fg.default' }
			}
			css={{ '> svg': { marginLeft: '5px' } }}
			{...(rest as Record<string, unknown>)}
		>
			{children}
			{subItems && subItems.length > 0 && (
				<TabItemSubItemsDropdown<T>
					activeSubItem={activeSubItem!}
					subItems={subItems}
					onSubItemChanged={onSubItemChanged!}
				/>
			)}
		</Box>
	);
};

export default TabItem;
