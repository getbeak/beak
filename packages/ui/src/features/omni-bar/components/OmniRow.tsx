import { Box, chakra, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { CornerDownLeft } from 'lucide-react';
import React, { forwardRef } from 'react';

import { CATEGORY_META } from '../lib/categories';
import type { OmniItem } from '../lib/types';

const MotionRow = motion.create(chakra('button'));

export interface OmniRowProps {
	item: OmniItem;
	active: boolean;
	onActivate: () => void;
	onHover: () => void;
}

const OmniRow = forwardRef<HTMLButtonElement, OmniRowProps>(({ item, active, onActivate, onHover }, ref) => {
	const Icon = item.icon;
	const accent = item.accent ?? CATEGORY_META[item.category].accent;

	return (
		<MotionRow
			ref={ref}
			type='button'
			role='option'
			aria-selected={active}
			tabIndex={-1}
			data-active={active || undefined}
			initial={false}
			animate={{ scale: active ? 1 : 1 }}
			whileTap={{ scale: 0.985 }}
			transition={{ type: 'spring', stiffness: 800, damping: 32 }}
			onClick={onActivate}
			onMouseMove={onHover}
			display='flex'
			alignItems='center'
			gap='2.5'
			w='calc(100% - 12px)'
			mx='1.5'
			my='0.5'
			px='2'
			py='1.5'
			borderRadius='md'
			textAlign='left'
			border='none'
			cursor='pointer'
			color={active ? 'fg.default' : 'fg.muted'}
			bg='transparent'
			outline='none'
			position='relative'
			css={{
				transition: 'background-color .12s ease, color .12s ease, box-shadow .12s ease',
				'&[data-active]': {
					color: 'var(--beak-colors-fg-default)',
					background: `color-mix(in srgb, ${accent} 18%, transparent)`,
					boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 38%, transparent)`,
				},
				'&:hover:not([data-active])': {
					backgroundColor: `color-mix(in srgb, ${accent} 9%, transparent)`,
					color: 'var(--beak-colors-fg-default)',
				},
			}}
		>
			<Flex
				flex='0 0 auto'
				align='center'
				justify='center'
				w='22px'
				h='22px'
				borderRadius='6px'
				color={active ? 'fg.default' : 'fg.subtle'}
				css={{
					background: active ? `color-mix(in srgb, ${accent} 24%, transparent)` : 'transparent',
					boxShadow: active
						? `inset 0 0 0 1px color-mix(in srgb, ${accent} 38%, transparent), 0 1px 0 color-mix(in srgb, white 6%, transparent)`
						: undefined,
					transition: 'background-color .14s ease, box-shadow .14s ease',
				}}
			>
				<Icon size={13} />
			</Flex>

			{item.badge && (
				<Box
					flex='0 0 auto'
					px='1.5'
					py='0.5'
					fontSize='9px'
					fontWeight='700'
					letterSpacing='0.06em'
					borderRadius='sm'
					style={{
						background: `color-mix(in srgb, ${item.badge.color} 22%, transparent)`,
						color: item.badge.color,
					}}
				>
					{item.badge.label}
				</Box>
			)}

			<Flex direction='column' minW='0' flex='1 1 auto' gap='0'>
				<Box
					fontSize='sm'
					fontWeight={active ? '600' : '500'}
					whiteSpace='nowrap'
					overflow='hidden'
					textOverflow='ellipsis'
					letterSpacing='-0.005em'
				>
					{item.title}
				</Box>
				{item.subtitle && (
					<Box fontSize='10.5px' color='fg.subtle' whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' mt='0.5'>
						{item.subtitle}
					</Box>
				)}
			</Flex>

			<Box
				flex='0 0 auto'
				opacity={active ? 1 : 0}
				transition='opacity .14s ease'
				color={active ? 'fg.muted' : 'fg.subtle'}
				css={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
			>
				<CornerDownLeft size={11} />
			</Box>
		</MotionRow>
	);
});

OmniRow.displayName = 'OmniRow';

export default OmniRow;
