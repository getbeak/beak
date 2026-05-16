import { Box, chakra, Flex } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

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

const SectionHeader: React.FC<React.PropsWithChildren<SectionHeaderProps>> = props => {
	const { inlineActions, secondaryHeaderSlot, children, collapsed, disableCollapse, onClick } = props;
	const hasFadingContent = secondaryHeaderSlot !== void 0 || (inlineActions && inlineActions.length > 0);

	return (
		<Flex
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
						{inlineActions?.map(action => {
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
						})}
					</Flex>
				)}
			</Flex>
		</Flex>
	);
};

export default SectionHeader;
