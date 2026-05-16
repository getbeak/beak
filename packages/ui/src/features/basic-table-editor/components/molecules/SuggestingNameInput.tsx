import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { HeaderSuggestion } from '../../constants/common-headers';

interface SuggestingNameInputProps {
	value: string;
	suggestions: HeaderSuggestion[];
	disabled?: boolean;
	placeholder?: string;
	innerRef?: (el: HTMLInputElement | null) => void;
	onChange: (value: string) => void;
}

interface PopupPosition {
	top: number;
	left: number;
	width: number;
}

const POPUP_WIDTH = 280;
const MAX_RESULTS = 8;

/**
 * Wraps `DebouncedInput` with a portal-positioned suggestion dropdown.
 * Behavior is intentionally minimal: shows on focus when the current
 * value has matches, navigates with arrow keys, commits with Enter or
 * Tab, dismisses with Escape (without losing input focus). Used by the
 * header table to surface common RFC header names — the input itself
 * still accepts arbitrary free text so authors aren't constrained to
 * the curated list.
 */
const SuggestingNameInput: React.FC<SuggestingNameInputProps> = ({
	value,
	suggestions,
	disabled,
	placeholder,
	innerRef,
	onChange,
}) => {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [focused, setFocused] = useState(false);
	const [active, setActive] = useState(0);
	const [pos, setPos] = useState<PopupPosition | null>(null);
	// We track the last typed value (not the prop) so the popup filters
	// against the user's in-flight keystrokes rather than the debounced
	// committed value — keeps the suggestions snappy.
	const [draft, setDraft] = useState(value);

	useEffect(() => {
		setDraft(value);
	}, [value]);

	const fuse = useMemo(
		() => new Fuse(suggestions, { keys: ['name', 'description'], includeScore: true, threshold: 0.4 }),
		[suggestions],
	);

	const matches = useMemo(() => {
		const trimmed = draft.trim();
		if (!trimmed) return suggestions.slice(0, MAX_RESULTS);
		// Already an exact (case-insensitive) match? Don't surface suggestions —
		// the user is done with this field.
		const exact = suggestions.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
		if (exact && exact.name === trimmed) return [];
		return fuse.search(trimmed, { limit: MAX_RESULTS }).map(r => r.item);
	}, [draft, suggestions, fuse]);

	const open = focused && matches.length > 0;

	useEffect(() => {
		setActive(0);
	}, [draft]);

	const updatePosition = useCallback(() => {
		const el = inputRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const width = Math.max(POPUP_WIDTH, rect.width);
		const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.left));
		setPos({ top: rect.bottom + 4, left, width });
	}, []);

	useEffect(() => {
		if (!open) return;
		updatePosition();
		const onScroll = () => updatePosition();
		const onResize = () => updatePosition();
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onResize);
		};
	}, [open, updatePosition]);

	function commit(name: string) {
		setDraft(name);
		onChange(name);
		// Close the popup so the user moves on cleanly; refocus the
		// input so the typeahead doesn't fight cell-to-cell navigation.
		setFocused(false);
		inputRef.current?.focus();
	}

	function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (!open) return;
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				setActive(a => (a + 1) % matches.length);
				return;
			case 'ArrowUp':
				event.preventDefault();
				setActive(a => (a - 1 + matches.length) % matches.length);
				return;
			case 'Enter':
			case 'Tab': {
				const item = matches[active];
				if (!item) return;
				// For Tab, let the focus-move continue naturally after committing.
				if (event.key === 'Enter') event.preventDefault();
				commit(item.name);
				return;
			}
			case 'Escape':
				event.preventDefault();
				setFocused(false);
				return;
			default:
				return;
		}
	}

	return (
		<React.Fragment>
			<DebouncedInput
				type='text'
				value={draft}
				disabled={disabled}
				placeholder={placeholder}
				innerRef={el => {
					inputRef.current = el;
					innerRef?.(el);
				}}
				onChange={v => {
					setDraft(v);
					onChange(v);
				}}
				onFocus={() => setFocused(true)}
				onBlur={() => {
					// A short delay so a click on a suggestion can fire its
					// mousedown handler before blur tears the popup down.
					window.setTimeout(() => setFocused(false), 100);
				}}
				onKeyDown={onKeyDown}
			/>
			{open && pos && (
				<SuggestionPopup
					pos={pos}
					matches={matches}
					active={active}
					query={draft}
					onHover={setActive}
					onPick={name => commit(name)}
				/>
			)}
		</React.Fragment>
	);
};

interface SuggestionPopupProps {
	pos: PopupPosition;
	matches: HeaderSuggestion[];
	active: number;
	query: string;
	onHover: (index: number) => void;
	onPick: (name: string) => void;
}

const SuggestionPopup: React.FC<SuggestionPopupProps> = ({ pos, matches, active, query, onHover, onPick }) => {
	const trimmed = query.trim().toLowerCase();
	const node = (
		<motion.div
			role='listbox'
			aria-label='Header name suggestions'
			initial={{ opacity: 0, y: -2 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -2 }}
			transition={{ duration: 0.1 }}
			style={{
				position: 'fixed',
				top: pos.top,
				left: pos.left,
				width: pos.width,
				zIndex: 110,
				borderRadius: 8,
				border: '1px solid var(--beak-colors-border-default)',
				background: 'var(--beak-colors-bg-surface)',
				boxShadow: '0 12px 32px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.14)',
				overflow: 'hidden',
			}}
		>
			<Box maxH='220px' overflowY='auto' py='1'>
				{matches.map((m, idx) => {
					const isActive = idx === active;
					return (
						<Flex
							key={m.name}
							role='option'
							aria-selected={isActive}
							onMouseEnter={() => onHover(idx)}
							onMouseDown={event => {
								// mousedown beats blur — commit before the input
								// blur handler tears the popup down.
								event.preventDefault();
								onPick(m.name);
							}}
							direction='column'
							gap='0.5'
							mx='1'
							px='2'
							py='1.5'
							borderRadius='md'
							cursor='pointer'
							bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)' : 'transparent'}
							color={isActive ? 'fg.default' : 'fg.muted'}
							transition='background-color .1s ease, color .1s ease'
						>
							<Box fontSize='12.5px' fontWeight={isActive ? '600' : '500'} letterSpacing='-0.005em'>
								{renderHighlighted(m.name, trimmed)}
							</Box>
							<Box fontSize='10.5px' color={isActive ? 'fg.muted' : 'fg.subtle'} lineHeight='1.35'>
								{m.description}
							</Box>
						</Flex>
					);
				})}
			</Box>
		</motion.div>
	);
	return createPortal(node, document.body);
};

function renderHighlighted(name: string, query: string) {
	if (!query) return name;
	const idx = name.toLowerCase().indexOf(query);
	if (idx < 0) return name;
	const end = idx + query.length;
	return (
		<React.Fragment>
			{name.slice(0, idx)}
			<Box
				as='mark'
				px='0.5'
				mx='-0.5'
				borderRadius='2px'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
				color='fg.default'
				fontWeight='700'
			>
				{name.slice(idx, end)}
			</Box>
			{name.slice(end)}
		</React.Fragment>
	);
}

export default SuggestingNameInput;
