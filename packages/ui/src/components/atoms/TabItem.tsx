import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
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
	onClose?: (event: React.MouseEvent) => void;
}

const TabItem = <T = string>(props: React.PropsWithChildren<TabItemProps<T>>): React.ReactElement => {
	const { active, activeSubItem, children, lazyForwardedRef, onClose, onSubItemChanged, size, subItems, ...rest } =
		props;

	const sm = size === 'sm';

	return (
		<Box
			ref={lazyForwardedRef as unknown as React.Ref<HTMLDivElement>}
			role='tab'
			aria-selected={active}
			position='relative'
			display='inline-flex'
			alignItems='center'
			gap='1'
			borderBottomWidth='1px'
			borderBottomStyle='solid'
			borderBottomColor='border.default'
			color={active ? 'fg.default' : 'fg.muted'}
			fontSize={sm ? 'sm' : 'md'}
			fontWeight={active ? '600' : '500'}
			px={sm ? '2' : '2.5'}
			py={sm ? '1' : '1.5'}
			cursor='pointer'
			whiteSpace='nowrap'
			transition='color .12s ease, background-color .12s ease, font-weight .12s ease'
			_hover={
				active
					? undefined
					: {
						color: 'fg.default',
						bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)',
					}
			}
			css={{ '> svg': { marginLeft: '5px' } }}
			{...(rest as Record<string, unknown>)}
		>
			{active && (
				<motion.div
					layoutId='tab-active-underline'
					transition={{ type: 'spring', stiffness: 700, damping: 36 }}
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: -1,
						height: 2.5,
						background: 'var(--beak-colors-accent-pink)',
						borderRadius: 2,
						boxShadow: '0 -1px 6px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
					}}
				/>
			)}
			<Box as='span' position='relative'>{children}</Box>
			{subItems && subItems.length > 0 && (
				<TabItemSubItemsDropdown<T>
					activeSubItem={activeSubItem!}
					subItems={subItems}
					onSubItemChanged={onSubItemChanged!}
				/>
			)}
			{onClose && (
				<Box
					as='span'
					position='relative'
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					w='14px'
					h='14px'
					ml='1'
					mr='-1'
					borderRadius='sm'
					color='fg.subtle'
					opacity={active ? 0.7 : 0}
					transition='opacity .12s ease, background-color .12s ease, color .12s ease'
					_hover={{
						color: 'fg.default',
						bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 80%, transparent)',
					}}
					css={{
						// reveal close button when parent tab is hovered/focused
						'[role=tab]:hover &, [role=tab]:focus-within &': { opacity: 1 },
					}}
					onClick={event => {
						event.stopPropagation();
						event.preventDefault();
						onClose(event);
					}}
				>
					<X size={10} />
				</Box>
			)}
		</Box>
	);
};

export default TabItem;
