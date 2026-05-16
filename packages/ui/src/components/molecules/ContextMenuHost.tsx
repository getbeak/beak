import { Box, Flex } from '@chakra-ui/react';
import type { MenuItemConstructorOptions } from 'electron';
import * as React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renderer-side context menu singleton. Beak used to dispatch context menus
 * through IPC — Electron showed a native popup, the web host hand-rolled a
 * DOM menu with inline styles. Two visually inconsistent surfaces, neither
 * matching the rest of the design system. This component is the single
 * source of truth: a portal-rendered Chakra menu invoked via
 * `showContextMenu(items, position)` from anywhere in the renderer.
 *
 * The Mount component is rendered once at the app root; the imperative
 * `showContextMenu` API in `utils/context-menu.ts` talks to it through a
 * module-level controller.
 */

export type ContextMenuItem = Pick<
	MenuItemConstructorOptions,
	'id' | 'type' | 'label' | 'enabled' | 'accelerator' | 'click'
>;

interface OpenState {
	items: ContextMenuItem[];
	x: number;
	y: number;
	// Bump on each open so the same items+position re-opens the menu.
	nonce: number;
}

type Listener = (state: OpenState | null) => void;
let listener: Listener | null = null;
let pendingState: OpenState | null = null;

/** Module-level imperative API — wired by `utils/context-menu.ts`. */
export const contextMenuController = {
	open(items: ContextMenuItem[], x: number, y: number) {
		const state = { items, x, y, nonce: Date.now() + Math.random() };
		pendingState = state;
		listener?.(state);
	},
	close() {
		pendingState = null;
		listener?.(null);
	},
};

const ContextMenuHost: React.FC = () => {
	const [state, setState] = useState<OpenState | null>(pendingState);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
	const [focused, setFocused] = useState<number>(-1);

	useEffect(() => {
		listener = setState;
		return () => {
			listener = null;
		};
	}, []);

	const visibleItems = state?.items ?? [];
	const enabledIndexes = useMemo(
		() =>
			visibleItems
				.map((item, idx) => ({ item, idx }))
				.filter(({ item }) => item.type !== 'separator' && item.enabled !== false)
				.map(({ idx }) => idx),
		[visibleItems],
	);

	// Reset keyboard focus whenever the menu reopens.
	useEffect(() => {
		setFocused(-1);
	}, [state?.nonce]);

	// Clamp inside the viewport once mounted.
	useLayoutEffect(() => {
		if (!state || !containerRef.current) {
			setPos(null);
			return;
		}
		const rect = containerRef.current.getBoundingClientRect();
		const margin = 4;
		const left = Math.max(margin, Math.min(state.x, window.innerWidth - rect.width - margin));
		const top = Math.max(margin, Math.min(state.y, window.innerHeight - rect.height - margin));
		setPos({ left, top });
	}, [state]);

	const close = useCallback(() => contextMenuController.close(), []);

	// Global listeners while open: outside-click + escape + scroll/resize/blur.
	useEffect(() => {
		if (!state) return;
		function onMouseDown(event: MouseEvent) {
			const root = containerRef.current;
			if (root && !root.contains(event.target as Node)) close();
		}
		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				close();
				return;
			}
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				if (enabledIndexes.length === 0) return;
				event.preventDefault();
				setFocused(prev => {
					const currentSlot = enabledIndexes.indexOf(prev);
					const delta = event.key === 'ArrowDown' ? 1 : -1;
					const nextSlot =
						currentSlot === -1
							? event.key === 'ArrowDown'
								? 0
								: enabledIndexes.length - 1
							: (currentSlot + delta + enabledIndexes.length) % enabledIndexes.length;
					return enabledIndexes[nextSlot]!;
				});
				return;
			}
			if (event.key === 'Enter') {
				event.preventDefault();
				if (focused === -1) return;
				const item = visibleItems[focused];
				if (!item || item.enabled === false || item.type === 'separator') return;
				close();
				(item.click as (() => void) | undefined)?.();
				return;
			}
		}
		document.addEventListener('mousedown', onMouseDown, true);
		document.addEventListener('keydown', onKey, true);
		document.addEventListener('scroll', close, true);
		window.addEventListener('blur', close);
		window.addEventListener('resize', close);
		return () => {
			document.removeEventListener('mousedown', onMouseDown, true);
			document.removeEventListener('keydown', onKey, true);
			document.removeEventListener('scroll', close, true);
			window.removeEventListener('blur', close);
			window.removeEventListener('resize', close);
		};
	}, [state, close, focused, enabledIndexes, visibleItems]);

	if (!state) return null;

	const menu = (
		<Box
			ref={containerRef}
			role='menu'
			position='fixed'
			minW='200px'
			maxW='320px'
			py='1'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.default'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 92%, transparent)'
			backdropFilter='blur(14px) saturate(160%)'
			boxShadow='0 14px 32px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.12), inset 0 1px 0 color-mix(in srgb, white 8%, transparent)'
			fontFamily='body'
			fontSize='13px'
			color='fg.default'
			zIndex={9999}
			style={{
				left: pos?.left ?? state.x,
				top: pos?.top ?? state.y,
				visibility: pos ? 'visible' : 'hidden',
			}}
			css={{
				animation: 'beak-ctxmenu-in 0.08s ease-out both',
				'@keyframes beak-ctxmenu-in': {
					'0%': { opacity: 0, transform: 'scale(0.98) translateY(-2px)' },
					'100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
				},
			}}
		>
			{visibleItems.map((item, idx) => {
				if (item.type === 'separator') {
					return (
						<Box
							// biome-ignore lint/suspicious/noArrayIndexKey: separator slots are positional
							key={`sep-${idx}`}
							role='separator'
							h='1px'
							my='1'
							mx='1.5'
							bg='border.subtle'
						/>
					);
				}
				const disabled = item.enabled === false;
				const isFocused = idx === focused;
				return (
					<Flex
						// biome-ignore lint/suspicious/noArrayIndexKey: item id may be missing
						key={item.id ?? `item-${idx}`}
						role='menuitem'
						aria-disabled={disabled || undefined}
						align='center'
						justify='space-between'
						gap='4'
						mx='1'
						px='2'
						py='1'
						borderRadius='sm'
						cursor={disabled ? 'not-allowed' : 'default'}
						color={disabled ? 'fg.disabled' : 'fg.default'}
						bg={!disabled && isFocused ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)' : undefined}
						_hover={
							disabled
								? undefined
								: {
										bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
									}
						}
						onMouseEnter={() => !disabled && setFocused(idx)}
						onMouseLeave={() => !disabled && setFocused(prev => (prev === idx ? -1 : prev))}
						onClick={() => {
							if (disabled) return;
							close();
							(item.click as (() => void) | undefined)?.();
						}}
					>
						<Box flex='1 1 auto' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
							{String(item.label ?? '')}
						</Box>
						{item.accelerator && (
							<Box
								as='span'
								flex='0 0 auto'
								fontSize='11px'
								fontFamily='mono'
								color={disabled ? 'fg.disabled' : 'fg.subtle'}
								letterSpacing='0.04em'
							>
								{String(item.accelerator)}
							</Box>
						)}
					</Flex>
				);
			})}
		</Box>
	);

	return createPortal(menu, document.body);
};

export default ContextMenuHost;
