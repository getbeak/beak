import { glassChakraProps } from '@beak/ui/lib/glass';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import BeakTooltip from '../../../../components/atoms/BeakTooltip';

export interface InlineSectionAction {
	id: string;
	label: string;
	icon: LucideIcon;
	disabled?: boolean;
	onClick: () => void;
}

interface SectionHeaderProps {
	inlineActions?: InlineSectionAction[];
	/**
	 * Custom React node rendered alongside the icon-button inline actions,
	 * inside the same hover-revealed cluster. Use for stateful controls
	 * (filter, sort) that don't fit the plain icon-button shape but should
	 * still fade in/out with the rest of the section actions.
	 */
	secondaryHeaderSlot?: React.ReactNode;
	collapsed?: boolean;
	disableCollapse?: boolean;
	onClick: () => void;
}

const ChakraButton = chakra('button');

// Width of one inline-action slot (18px button + 0.5 gap ≈ 20px).
const ACTION_SLOT_PX = 20;
// Min width the title needs before we declare the row too tight and fold
// the icons into a single overflow menu. Picked so a 12–14 character project
// name still renders without ellipsis at common sidebar widths.
const TITLE_MIN_PX = 110;
// Chevron column + horizontal paddings + a 22px reserve for the overflow
// button (which always sits on the right when in compact mode).
const FIXED_OVERHEAD_PX = 12 + 24 + 22;

const SectionHeader: React.FC<React.PropsWithChildren<SectionHeaderProps>> = props => {
	const { inlineActions, secondaryHeaderSlot, children, collapsed, disableCollapse, onClick } = props;
	const hasInlineActions = inlineActions !== void 0 && inlineActions.length > 0;
	const hasFadingContent = secondaryHeaderSlot !== void 0 || hasInlineActions;

	const headerRef = useRef<HTMLDivElement | null>(null);
	const [compact, setCompact] = useState(false);

	// Track header width and flip to a single overflow-menu trigger whenever
	// laying out all the inline icons would crowd the project name. Only the
	// `inlineActions` collapse — `secondaryHeaderSlot` stays visible because
	// it's typically a stateful chip (e.g., the explorer's tree filter) that
	// doesn't translate into a Menu.Item.
	useEffect(() => {
		const node = headerRef.current;
		if (!node) return;
		if (!hasInlineActions) {
			setCompact(false);
			return;
		}
		const nActions = inlineActions?.length ?? 0;
		const expandedActionsPx = nActions * ACTION_SLOT_PX;
		const threshold = FIXED_OVERHEAD_PX + TITLE_MIN_PX + expandedActionsPx;

		const update = (width: number) => {
			setCompact(width < threshold);
		};
		update(node.getBoundingClientRect().width);
		const ro = new ResizeObserver(entries => {
			for (const entry of entries) update(entry.contentRect.width);
		});
		ro.observe(node);
		return () => ro.disconnect();
	}, [hasInlineActions, inlineActions]);

	const showCompactMenu = compact && hasInlineActions;

	return (
		<Flex
			ref={headerRef}
			role='button'
			aria-expanded={!collapsed}
			aria-disabled={disableCollapse}
			tabIndex={disableCollapse ? -1 : 0}
			justify='space-between'
			align='center'
			h='28px'
			px='3'
			textTransform='uppercase'
			fontSize='11px'
			fontWeight='600'
			letterSpacing='0.04em'
			color='fg.muted'
			cursor={disableCollapse ? 'default' : 'pointer'}
			transition='color .1s linear, background-color .1s linear'
			_hover={{
				color: 'fg.default',
				bg: disableCollapse ? undefined : 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)',
			}}
			_focusVisible={{
				outline: 'none',
				color: 'fg.default',
				boxShadow: 'inset 0 0 0 1px var(--beak-colors-accent-pink)',
			}}
			onClick={onClick}
			onKeyDown={(event: React.KeyboardEvent) => {
				if (disableCollapse) return;
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					onClick();
				}
			}}
			css={{
				'&:hover [data-section-actions], &:focus-within [data-section-actions]': { opacity: 1 },
			}}
		>
			<Flex align='center' gap='1' minW={0}>
				{/* Chevron reserves space even when disableCollapse, so titles
				    (and body content indented to title position) stay aligned
				    across sections regardless of whether the chevron renders. */}
				<Box
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					w='12px'
					h='12px'
					flexShrink={0}
					color='fg.subtle'
					transform={collapsed ? 'rotate(0deg)' : 'rotate(90deg)'}
					transition='transform .12s ease-out'
					opacity={disableCollapse ? 0 : 1}
				>
					<ChevronRight size={12} strokeWidth={2} />
				</Box>
				<Box overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
					{children}
				</Box>
			</Flex>
			<Flex align='center' gap='0.5'>
				{hasFadingContent && (
					<Flex data-section-actions align='center' gap='0.5' opacity={0} transition='opacity .12s linear'>
						{secondaryHeaderSlot}
						{showCompactMenu ? (
							<OverflowMenu actions={inlineActions ?? []} />
						) : (
							inlineActions?.map(action => {
								const Icon = action.icon;
								return (
									<BeakTooltip key={action.id} content={action.label}>
										<ChakraButton
											type='button'
											role='button'
											aria-label={action.label}
											disabled={action.disabled}
											display='inline-flex'
											alignItems='center'
											justifyContent='center'
											w='18px'
											h='18px'
											bg='transparent'
											border='none'
											borderRadius='sm'
											color='fg.subtle'
											cursor={action.disabled ? 'not-allowed' : 'pointer'}
											transition='color .1s linear, background-color .1s linear'
											_hover={{
												color: action.disabled ? 'fg.subtle' : 'fg.default',
												bg: action.disabled ? undefined : 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
											}}
											_focusVisible={{
												outline: 'none',
												color: 'fg.default',
												boxShadow: 'inset 0 0 0 1px var(--beak-colors-accent-pink)',
											}}
											onClick={event => {
												event.preventDefault();
												event.stopPropagation();
												if (!action.disabled) action.onClick();
											}}
											onKeyDown={event => {
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													event.stopPropagation();
													if (!action.disabled) action.onClick();
												}
											}}
										>
											<Icon size={12} strokeWidth={1.8} />
										</ChakraButton>
									</BeakTooltip>
								);
							})
						)}
					</Flex>
				)}
			</Flex>
		</Flex>
	);
};

interface OverflowMenuProps {
	actions: InlineSectionAction[];
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({ actions }) => (
	<Menu.Root>
		<Menu.Trigger asChild>
			<ChakraButton
				type='button'
				aria-label='More actions'
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				w='18px'
				h='18px'
				bg='transparent'
				border='none'
				borderRadius='sm'
				color='fg.subtle'
				cursor='pointer'
				transition='color .1s linear, background-color .1s linear'
				_hover={{
					color: 'fg.default',
					bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					color: 'fg.default',
					boxShadow: 'inset 0 0 0 1px var(--beak-colors-accent-pink)',
				}}
				onClick={event => {
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				<MoreHorizontal size={12} strokeWidth={1.8} />
			</ChakraButton>
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner>
				<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='180px'>
					{actions.map(action => {
						const Icon = action.icon;
						return (
							<Menu.Item
								key={action.id}
								value={action.id}
								disabled={action.disabled}
								onClick={event => {
									event.stopPropagation();
									if (!action.disabled) action.onClick();
								}}
								fontSize='xs'
								fontWeight='500'
								borderRadius='sm'
								py='1.5'
								px='2'
								gap='2'
								color='fg.default'
								_hover={{
									bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
								}}
							>
								<Icon size={12} strokeWidth={1.8} />
								<Box as='span'>{action.label}</Box>
							</Menu.Item>
						);
					})}
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

export default SectionHeader;
