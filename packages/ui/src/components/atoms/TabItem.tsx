import { Box } from '@chakra-ui/react';
import { X } from 'lucide-react';
import * as React from 'react';

import TabItemSubItemsDropdown from './TabItemSubItemsDropdown';

export interface TabSubItem<T = string> {
	key: T;
	label: string;
}

export type TabItemVariant = 'underline' | 'card';

export interface TabItemProps<T = string> extends Omit<React.HTMLProps<HTMLDivElement>, 'size'> {
	active?: boolean;
	activeSubItem?: string;
	lazyForwardedRef?: React.LegacyRef<HTMLDivElement>;
	size?: 'sm' | 'md';
	variant?: TabItemVariant;
	leading?: React.ReactNode;
	subItems?: TabSubItem<T>[];
	onSubItemChanged?: (subItem: T) => void;
	onClose?: (event: React.MouseEvent) => void;
}

const TabItem = <T = string>(props: React.PropsWithChildren<TabItemProps<T>>): React.ReactElement => {
	const {
		active,
		activeSubItem,
		children,
		lazyForwardedRef,
		leading,
		onClose,
		onSubItemChanged,
		size,
		subItems,
		variant = 'underline',
		...rest
	} = props;

	const sm = size === 'sm';
	const isCard = variant === 'card';

	return (
		<Box
			ref={lazyForwardedRef as unknown as React.Ref<HTMLDivElement>}
			role='tab'
			aria-selected={active}
			position='relative'
			display='inline-flex'
			alignItems='center'
			gap='1.5'
			color={active ? 'fg.default' : 'fg.muted'}
			fontSize={isCard ? 'sm' : sm ? 'sm' : 'md'}
			fontWeight={active ? '600' : '500'}
			letterSpacing={isCard ? '-0.005em' : undefined}
			px={isCard ? '2.5' : sm ? '2' : '2.5'}
			py={isCard ? '1.5' : sm ? '1' : '1.5'}
			pl={isCard ? '2.5' : undefined}
			pr={isCard && onClose ? '1.5' : undefined}
			h={isCard ? '30px' : undefined}
			mt={isCard ? '0.5' : undefined}
			borderTopLeftRadius={isCard ? 'md' : undefined}
			borderTopRightRadius={isCard ? 'md' : undefined}
			borderTopWidth={isCard ? '1px' : undefined}
			borderLeftWidth={isCard ? '1px' : undefined}
			borderRightWidth={isCard ? '1px' : undefined}
			borderTopStyle={isCard ? 'solid' : undefined}
			borderLeftStyle={isCard ? 'solid' : undefined}
			borderRightStyle={isCard ? 'solid' : undefined}
			borderTopColor={isCard && active ? 'border.subtle' : 'transparent'}
			borderLeftColor={isCard && active ? 'border.subtle' : 'transparent'}
			borderRightColor={isCard && active ? 'border.subtle' : 'transparent'}
			borderBottomWidth={isCard ? '0' : '1px'}
			borderBottomStyle={isCard ? undefined : 'solid'}
			borderBottomColor={isCard ? undefined : 'border.default'}
			bg={isCard && active ? 'bg.surface' : 'transparent'}
			boxShadow={isCard && active ? '0 -2px 6px color-mix(in srgb, var(--beak-colors-gray-900) 6%, transparent)' : undefined}
			cursor='pointer'
			whiteSpace='nowrap'
			transition='color .12s ease, background-color .12s ease, font-weight .12s ease'
			_hover={
				active
					? undefined
					: {
						color: 'fg.default',
						bg: isCard
							? 'color-mix(in srgb, var(--beak-colors-bg-surface) 55%, transparent)'
							: 'color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)',
					}
			}
			css={{ '> svg': { marginLeft: '5px' } }}
			{...(rest as Record<string, unknown>)}
		>
			{active && (
				<Box
					position='absolute'
					left={isCard ? '8px' : '0'}
					right={isCard ? '8px' : '0'}
					top={isCard ? '0' : undefined}
					bottom={isCard ? undefined : '-1px'}
					h={isCard ? '2px' : '2.5px'}
					bg='accent.pink'
					borderRadius='2px'
					boxShadow={
						isCard
							? '0 1px 6px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)'
							: '0 -1px 6px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)'
					}
				/>
			)}
			{leading && (
				<Box as='span' position='relative' display='inline-flex' alignItems='center'>
					{leading}
				</Box>
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
					w='16px'
					h='16px'
					ml='1'
					mr={isCard ? '0' : '-1'}
					borderRadius='sm'
					color='fg.subtle'
					opacity={active ? 0.7 : 0}
					transition='opacity .12s ease, background-color .12s ease, color .12s ease'
					_hover={{
						color: 'accent.alert',
						bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)',
					}}
					css={{
						'[role=tab]:hover &, [role=tab]:focus-within &': { opacity: 1 },
					}}
					onClick={event => {
						event.stopPropagation();
						event.preventDefault();
						onClose(event);
					}}
				>
					<X size={11} strokeWidth={2.4} />
				</Box>
			)}
		</Box>
	);
};

export default TabItem;
