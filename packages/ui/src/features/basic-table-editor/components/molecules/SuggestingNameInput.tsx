import useDebounce from '@beak/ui/hooks/use-debounce';
import { glassInlineStyle } from '@beak/ui/lib/glass';
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
	// Local draft updates on every keystroke so the suggestion list re-filters
	// instantly. The parent `onChange` is debounced separately below so we
	// don't spam redux on every character.
	const [draft, setDraft] = useState(value);
	const dirtyRef = useRef(false);

	useEffect(() => {
		dirtyRef.current = false;
		setDraft(value);
	}, [value]);

	useDebounce(
		() => {
			if (dirtyRef.current) onChange(draft);
		},
		300,
		[draft],
	);

	const fuse = useMemo(
		() => new Fuse(suggestions, { keys: ['name', 'description'], includeScore: true, threshold: 0.4 }),
		[suggestions],
	);

	// The header list is small (~50 items) but we still debounce the fuzzy
	// search so a fast typist doesn't pay a fuse.search() on every keystroke.
	// 60ms is well under the perceptual threshold and lets us coalesce bursts.
	const [searchTerm, setSearchTerm] = useState(value);
	useDebounce(() => setSearchTerm(draft), 60, [draft]);

	const matches = useMemo(() => {
		const trimmed = searchTerm.trim();
		if (!trimmed) return suggestions.slice(0, MAX_RESULTS);
		// Already an exact (case-insensitive) match? Don't surface suggestions —
		// the user is done with this field.
		const exact = suggestions.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
		if (exact && exact.name === trimmed) return [];
		return fuse.search(trimmed, { limit: MAX_RESULTS }).map(r => r.item);
	}, [searchTerm, suggestions, fuse]);

	const open = focused && matches.length > 0;

	useEffect(() => {
		setActive(0);
	}, [searchTerm]);

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
		dirtyRef.current = false;
		setDraft(name);
		setSearchTerm(name);
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
			<input
				type='text'
				value={draft}
				disabled={disabled}
				placeholder={placeholder}
				ref={el => {
					inputRef.current = el;
					innerRef?.(el);
				}}
				onChange={event => {
					dirtyRef.current = true;
					setDraft(event.target.value);
				}}
				onFocus={() => setFocused(true)}
				onBlur={() => {
					// Flush any pending draft to the parent before closing — the
					// debounce timer might still be waiting when the user tabs
					// out, and we don't want to drop in-flight edits.
					if (dirtyRef.current) {
						dirtyRef.current = false;
						onChange(draft);
					}
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
				overflow: 'hidden',
				...glassInlineStyle.popover,
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
