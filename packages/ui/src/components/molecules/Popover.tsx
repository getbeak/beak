import { glassChakraProps } from '@beak/ui/lib/glass';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Anchored popover primitive — the popover equivalent of `Dialog`. A solid
 * card pinned next to an anchor element, viewport-clamped, with auto-flip
 * above when there isn't room below.
 *
 * Compose via the slot components — `PopoverHeader`, `PopoverBody`,
 * `PopoverFooter` — so anchored editors don't each hand-roll their own
 * positioning, surface, and chrome.
 */

interface PopoverProps {
	/** Anchor the popover relative to this element. */
	anchor: HTMLElement | null;
	onClose: () => void;
	/** Width in pixels. Defaults to 320. */
	width?: number;
	/** Preferred vertical placement; auto-flips when there isn't room. */
	placement?: 'bottom' | 'top';
	/** Horizontal alignment relative to the anchor. */
	align?: 'start' | 'center' | 'end';
	/** Distance between the anchor and the popover, in px. */
	offset?: number;
	/** ARIA label for the popover container. */
	ariaLabel?: string;
	/** When true, clicking the backdrop closes the popover. Default true. */
	closeOnOutsideClick?: boolean;
	/** Optional accent for the header dot / focus ring. */
	tone?: 'pink' | 'teal' | 'indigo' | 'alert';
}

const TONE_ACCENT: Record<NonNullable<PopoverProps['tone']>, string> = {
	pink: 'var(--beak-colors-accent-pink)',
	teal: 'var(--beak-colors-accent-teal)',
	indigo: 'var(--beak-colors-accent-indigo)',
	alert: 'var(--beak-colors-accent-alert)',
};

const VIEWPORT_MARGIN = 8;
const MotionBox = motion.create(Box);

interface PopoverToneContextValue {
	accent: string;
	tone: NonNullable<PopoverProps['tone']>;
}

const PopoverToneContext = React.createContext<PopoverToneContextValue>({
	accent: TONE_ACCENT.pink,
	tone: 'pink',
});

const Popover: React.FC<React.PropsWithChildren<PopoverProps>> = ({
	anchor,
	onClose,
	width = 320,
	placement = 'bottom',
	align = 'center',
	offset = 8,
	ariaLabel,
	closeOnOutsideClick = true,
	tone = 'pink',
	children,
}) => {
	const popoverRef = useRef<HTMLDivElement | null>(null);
	const [pos, setPos] = useState<{ top: number; left: number; flipped: boolean; maxHeight: number } | null>(null);
	const accent = TONE_ACCENT[tone];
	const toneValue = React.useMemo(() => ({ accent, tone }), [accent, tone]);

	useLayoutEffect(() => {
		if (!anchor) {
			setPos(null);
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const popoverHeight = popoverRef.current?.offsetHeight ?? 240;

		const desiredLeft = (() => {
			if (align === 'start') return rect.left;
			if (align === 'end') return rect.right - width;
			return rect.left + rect.width / 2 - width / 2;
		})();
		const left = Math.max(VIEWPORT_MARGIN, Math.min(desiredLeft, window.innerWidth - width - VIEWPORT_MARGIN));

		const wantsBottom = placement === 'bottom';
		const spaceBelow = window.innerHeight - rect.bottom - offset - VIEWPORT_MARGIN;
		const spaceAbove = rect.top - offset - VIEWPORT_MARGIN;
		const flipped = wantsBottom
			? spaceBelow < popoverHeight && spaceAbove > spaceBelow
			: spaceAbove >= popoverHeight || spaceAbove > spaceBelow;

		const top = flipped
			? Math.max(VIEWPORT_MARGIN, rect.top - offset - popoverHeight)
			: Math.min(window.innerHeight - popoverHeight - VIEWPORT_MARGIN, rect.bottom + offset);
		const maxHeight = flipped ? spaceAbove : spaceBelow;

		setPos({ top, left, flipped, maxHeight: Math.max(160, maxHeight) });
	}, [anchor, width, placement, align, offset]);

	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
			}
		}
		function onResize() {
			// Force a re-layout by nudging state — useLayoutEffect re-runs on
			// anchor change, not on viewport change.
			setPos(prev => (prev ? { ...prev } : prev));
			onClose();
		}
		window.addEventListener('keydown', onKey);
		window.addEventListener('resize', onResize);
		window.addEventListener('blur', onClose);
		return () => {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('blur', onClose);
		};
	}, [onClose]);

	if (!anchor) return null;

	return createPortal(
		<Box
			position='fixed'
			inset='0'
			zIndex={101}
			onClick={() => {
				if (closeOnOutsideClick) onClose();
			}}
			style={{ pointerEvents: closeOnOutsideClick ? 'auto' : 'none' }}
		>
			<MotionBox
				ref={popoverRef as unknown as React.Ref<HTMLDivElement>}
				role='dialog'
				aria-label={ariaLabel}
				initial={{ opacity: 0, scale: 0.97, y: -2 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.97, y: -2 }}
				transition={{ duration: 0.12 }}
				position='fixed'
				w={`${width}px`}
				maxH={`${pos?.maxHeight ?? 480}px`}
				display='flex'
				flexDirection='column'
				borderRadius='lg'
				{...glassChakraProps.popover}
				overflow='hidden'
				style={{
					top: pos?.top ?? -9999,
					left: pos?.left ?? -9999,
					visibility: pos ? 'visible' : 'hidden',
					pointerEvents: 'auto',
					WebkitBackdropFilter: 'blur(28px) saturate(180%)',
				}}
				onClick={event => event.stopPropagation()}
			>
				<PopoverToneContext.Provider value={toneValue}>{children}</PopoverToneContext.Provider>
			</MotionBox>
		</Box>,
		document.body,
	);
};

interface PopoverHeaderProps {
	title: React.ReactNode;
	/** Optional inline status dot (uses the popover's accent tone). */
	showAccentDot?: boolean;
	/** Right-side adornment — typically a small badge or icon. */
	trailing?: React.ReactNode;
}

export const PopoverHeader: React.FC<PopoverHeaderProps> = ({ title, showAccentDot = true, trailing }) => {
	const { accent } = React.useContext(PopoverToneContext);
	return (
		<Flex
			align='center'
			justify='space-between'
			gap='2'
			px='3'
			py='2'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			flex='0 0 auto'
		>
			<Flex align='center' gap='1.5' minW={0}>
				{showAccentDot && (
					<Box
						w='6px'
						h='6px'
						borderRadius='full'
						bg={accent}
						boxShadow={`0 0 6px color-mix(in srgb, ${accent} 60%, transparent)`}
						flex='0 0 auto'
					/>
				)}
				<Box
					fontSize='12px'
					fontWeight='600'
					color='fg.default'
					letterSpacing='-0.005em'
					overflow='hidden'
					textOverflow='ellipsis'
					whiteSpace='nowrap'
				>
					{title}
				</Box>
			</Flex>
			{trailing && <Box flex='0 0 auto'>{trailing}</Box>}
		</Flex>
	);
};

interface PopoverBodyProps {
	padding?: string;
}

export const PopoverBody: React.FC<React.PropsWithChildren<PopoverBodyProps>> = ({ children, padding = '12px' }) => (
	<Box flex='1 1 auto' minH={0} overflowY='auto' p={padding}>
		{children}
	</Box>
);

interface PopoverFooterProps {
	/** Optional left-side content — keyboard hints, status etc. */
	leading?: React.ReactNode;
}

export const PopoverFooter: React.FC<React.PropsWithChildren<PopoverFooterProps>> = ({ leading, children }) => (
	<Flex
		align='center'
		justify='space-between'
		gap='2'
		px='3'
		py='2'
		borderTopWidth='1px'
		borderColor='border.subtle'
		bg='bg.canvas'
		flex='0 0 auto'
	>
		<Box flex='1 1 auto' minW={0}>
			{leading}
		</Box>
		<Flex gap='2' flex='0 0 auto'>
			{children}
		</Flex>
	</Flex>
);

export default Popover;
