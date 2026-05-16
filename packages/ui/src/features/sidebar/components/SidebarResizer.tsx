import { Box } from '@chakra-ui/react';
import * as React from 'react';
import { useEffect, useRef } from 'react';

import type { SidebarWidthControl } from '../hooks/use-sidebar-width';

interface SidebarResizerProps {
	control: SidebarWidthControl;
}

/**
 * 1px vertical splitter with an 11px wide invisible hit zone (5px each
 * side), pink hover/active highlight, ARIA `separator` role, arrow-key
 * resize (Shift = bigger step, Home = reset), double-click to reset to a
 * sensible default. Pointer capture keeps drag tracking even when the
 * cursor leaves the strip.
 */
const SidebarResizer: React.FC<SidebarResizerProps> = ({ control }) => {
	const { width, dragging, min, max, beginDrag, updateDrag, commitDrag, cancelDrag, setWidth, reset } = control;

	const startRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

	const finishDrag = (commit: boolean, element: HTMLDivElement | null) => {
		const start = startRef.current;
		if (!start) return;
		startRef.current = null;
		document.body.classList.remove('reflex-col-resize');
		if (element?.hasPointerCapture(start.pointerId)) element.releasePointerCapture(start.pointerId);
		if (commit) commitDrag();
		else cancelDrag();
	};

	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) return;
		event.preventDefault();
		(event.target as HTMLElement).focus({ preventScroll: true });
		event.currentTarget.setPointerCapture(event.pointerId);
		startRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: width };
		beginDrag(width);
		document.body.classList.add('reflex-col-resize');
	};

	const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const start = startRef.current;
		if (!start) return;
		updateDrag(start.startWidth + (event.clientX - start.startX));
	};

	const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		finishDrag(true, event.currentTarget);
	};

	const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
		finishDrag(false, event.currentTarget);
	};

	// ESC during an in-flight drag = abort without saving.
	useEffect(() => {
		if (!dragging) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			startRef.current = null;
			document.body.classList.remove('reflex-col-resize');
			cancelDrag();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [cancelDrag, dragging]);

	const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Home' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			reset();
			return;
		}
		let delta = 0;
		if (event.key === 'ArrowLeft') delta = -10;
		else if (event.key === 'ArrowRight') delta = 10;
		else return;
		if (event.shiftKey) delta *= 5;
		event.preventDefault();
		setWidth(width + delta);
	};

	return (
		<Box
			role='separator'
			aria-orientation='vertical'
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={Math.round(width)}
			aria-label='Resize sidebar (double-click to reset)'
			tabIndex={0}
			position='relative'
			flexShrink={0}
			w='1px'
			h='100%'
			bg='var(--beak-colors-border-emphasized)'
			zIndex={3}
			cursor='col-resize'
			transition={dragging ? 'none' : 'background-color .18s ease, box-shadow .18s ease'}
			data-active={dragging || undefined}
			_hover={{
				bg: 'var(--beak-colors-accent-pink)',
				boxShadow:
					'0 0 0 1px var(--beak-colors-accent-pink), 0 0 8px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
			}}
			_focusVisible={{
				outline: 'none',
				bg: 'var(--beak-colors-accent-pink)',
				boxShadow:
					'0 0 0 1px var(--beak-colors-accent-pink), 0 0 8px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
			}}
			css={{
				'&[data-active="true"]': {
					backgroundColor: 'var(--beak-colors-accent-pink)',
					boxShadow:
						'0 0 0 1px var(--beak-colors-accent-pink), 0 0 12px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
				},
			}}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerCancel}
			onLostPointerCapture={onPointerCancel}
			onDoubleClick={reset}
			onKeyDown={onKeyDown}
		>
			{/* Wider invisible hit zone so the grab target is comfortable without
			    making the visible line thicker. */}
			<Box position='absolute' top='0' bottom='0' left='-5px' right='-5px' cursor='col-resize' />
		</Box>
	);
};

export default SidebarResizer;
