import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';

import { CATEGORY_META } from '../lib/categories';
import type { OmniGroup, OmniItem } from '../lib/types';
import OmniRow from './OmniRow';

const MotionBox = motion.create(Box);

export interface OmniListProps {
	groups: OmniGroup[];
	flatItems: OmniItem[];
	activeIndex: number;
	onSelect: (item: OmniItem) => void;
	onHoverIndex: (index: number) => void;
}

const OmniList: React.FC<OmniListProps> = ({ groups, flatItems, activeIndex, onSelect, onHoverIndex }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const activeRef = useRef<HTMLButtonElement | null>(null);

	useLayoutEffect(() => {
		const el = activeRef.current;
		if (!el) return;
		// @ts-expect-error scrollIntoViewIfNeeded exists in Chromium
		if (typeof el.scrollIntoViewIfNeeded === 'function') {
			// @ts-expect-error see above
			el.scrollIntoViewIfNeeded(false);
		} else {
			el.scrollIntoView({ block: 'nearest' });
		}
	}, [activeIndex]);

	let cursor = 0;

	return (
		<Box
			ref={containerRef}
			flex='1 1 auto'
			minH='0'
			overflowX='hidden'
			overflowY='auto'
			py='1'
			role='listbox'
			aria-label='Search results'
			css={{
				'&::-webkit-scrollbar': { width: '6px' },
				'&::-webkit-scrollbar-thumb': {
					background: 'color-mix(in srgb, var(--beak-colors-fg-muted) 22%, transparent)',
					borderRadius: '3px',
				},
				'&::-webkit-scrollbar-thumb:hover': {
					background: 'color-mix(in srgb, var(--beak-colors-fg-muted) 45%, transparent)',
				},
			}}
		>
			{groups.map(group => {
				const meta = CATEGORY_META[group.categoryKey];
				const startCursor = cursor;
				cursor += group.items.length;

				return (
					<MotionBox
						key={meta.key}
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.18, ease: 'easeOut' }}
						mb='1'
					>
						<Flex
							align='center'
							justify='space-between'
							px='3'
							pt='2'
							pb='0.5'
							fontSize='9.5px'
							fontWeight='700'
							letterSpacing='0.08em'
							textTransform='uppercase'
							color='fg.subtle'
							gap='2'
						>
							<Flex align='center' gap='1.5'>
								<Box
									w='6px'
									h='6px'
									borderRadius='full'
									style={{
										background: meta.accent,
										boxShadow: `0 0 10px ${meta.accent}`,
									}}
								/>
								<Box style={{ color: meta.accent }}>{meta.label}</Box>
							</Flex>
							<Box fontSize='9px' color='fg.disabled' fontWeight='600'>
								{group.items.length}
							</Box>
						</Flex>

						<Box>
							{group.items.map((item, idx) => {
								const globalIndex = startCursor + idx;
								const isActive = globalIndex === activeIndex;
								return (
									<OmniRow
										key={item.id}
										ref={(el: HTMLButtonElement | null) => {
											if (isActive) activeRef.current = el;
										}}
										item={item}
										active={isActive}
										onActivate={() => onSelect(item)}
										onHover={() => onHoverIndex(globalIndex)}
									/>
								);
							})}
						</Box>
					</MotionBox>
				);
			})}

			{flatItems.length === 0 && <Box h='1' />}
		</Box>
	);
};

export default OmniList;
