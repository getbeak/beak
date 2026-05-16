import * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Tracks modifier flags and the set of non-modifier keys currently held down
 * on the document. Consumed by `Kbd` so the on-screen keycaps depress when
 * the user actually presses those keys.
 *
 * `keys` stores `event.key` values normalized to upper-case for single-char
 * letters (so 'b' becomes 'B'); other keys ('Enter', 'Tab', 'ArrowUp', etc.)
 * are kept verbatim.
 */
export interface KeyboardState {
	modifiers: { meta: boolean; ctrl: boolean; alt: boolean; shift: boolean };
	keys: ReadonlySet<string>;
}

const EMPTY: KeyboardState = {
	modifiers: { meta: false, ctrl: false, alt: false, shift: false },
	keys: new Set(),
};

const KeyboardStateContext = createContext<KeyboardState>(EMPTY);

function normalize(key: string): string {
	if (key.length === 1) return key.toLocaleUpperCase();
	return key;
}

export const KeyboardStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [, setRev] = useState(0);
	// We mutate the same Set in place to avoid allocations on every keystroke,
	// and bump a tick to force re-render. Consumers read the live state from
	// the ref via the context object below.
	const heldRef = useRef<Set<string>>(new Set());
	const modsRef = useRef({ meta: false, ctrl: false, alt: false, shift: false });

	useEffect(() => {
		function syncMods(e: KeyboardEvent) {
			const next = {
				meta: e.metaKey,
				ctrl: e.ctrlKey,
				alt: e.altKey,
				shift: e.shiftKey,
			};
			const prev = modsRef.current;
			if (
				prev.meta !== next.meta ||
				prev.ctrl !== next.ctrl ||
				prev.alt !== next.alt ||
				prev.shift !== next.shift
			) {
				modsRef.current = next;
				return true;
			}
			return false;
		}

		function onKeyDown(e: KeyboardEvent) {
			const modsChanged = syncMods(e);
			let keysChanged = false;
			const k = normalize(e.key);
			// Skip pure modifier `event.key`s — they're tracked via flags.
			if (k !== 'Meta' && k !== 'Control' && k !== 'Alt' && k !== 'Shift') {
				if (!heldRef.current.has(k)) {
					heldRef.current.add(k);
					keysChanged = true;
				}
			}
			if (modsChanged || keysChanged) setRev(r => r + 1);
		}

		function onKeyUp(e: KeyboardEvent) {
			const modsChanged = syncMods(e);
			const k = normalize(e.key);
			let keysChanged = false;
			if (heldRef.current.delete(k)) keysChanged = true;
			if (modsChanged || keysChanged) setRev(r => r + 1);
		}

		function onBlur() {
			// Clear everything when the window loses focus — otherwise modifier
			// keys "stick" because we never see the keyup event.
			heldRef.current.clear();
			modsRef.current = { meta: false, ctrl: false, alt: false, shift: false };
			setRev(r => r + 1);
		}

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('blur', onBlur);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', onBlur);
		};
	}, []);

	const value = useMemo<KeyboardState>(
		() => ({
			modifiers: modsRef.current,
			keys: heldRef.current,
		}),
		// Intentional: rev tick recomputes through ref reads.
		// biome-ignore lint/correctness/useExhaustiveDependencies: rev-tick re-renders, refs stay live
		[heldRef.current, modsRef.current],
	);

	return <KeyboardStateContext.Provider value={value}>{children}</KeyboardStateContext.Provider>;
};

/**
 * Returns true when the on-screen key with the given label is currently held.
 * Accepts the rendered glyph (e.g. `⌘`, `⇧`, `Alt`, `N`, `Enter`) and maps it
 * to the actual modifier flag or key value.
 */
export function useIsKeyHeld(label: string): boolean {
	const { modifiers, keys } = useContext(KeyboardStateContext);

	switch (label) {
		case '⌘':
			return modifiers.meta;
		case '⌃':
			return modifiers.ctrl;
		case '⌥':
		case 'Alt':
			return modifiers.alt;
		case '⇧':
			return modifiers.shift;
		case 'Ctrl':
			return modifiers.ctrl;
		case '↑':
			return keys.has('ArrowUp');
		case '↓':
			return keys.has('ArrowDown');
		case '←':
			return keys.has('ArrowLeft');
		case '→':
			return keys.has('ArrowRight');
		default:
			if (label.length === 1) return keys.has(label.toLocaleUpperCase());
			return keys.has(label);
	}
}
