import type { TabItem } from '@beak/common/types/beak-project';
import { instance as windowSession } from '@beak/ui/contexts/window-session-context';
import { glassChakraProps } from '@beak/ui/lib/glass';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex, Portal } from '@chakra-ui/react';
import {
	Cookie as CookieIcon,
	FileText,
	FlaskConical,
	Folder,
	Home,
	Settings,
	Sparkles,
	Table,
	Workflow,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { changeTab } from '../store/actions';

interface IconForTabProps {
	tab: TabItem;
	size?: number;
}

const IconForTab: React.FC<IconForTabProps> = ({ tab, size = 14 }) => {
	switch (tab.type) {
		case 'request':
			return <FileText size={size} strokeWidth={2} />;
		case 'folder_overview':
			return <Folder size={size} strokeWidth={2} />;
		case 'workflow_editor':
			return <Workflow size={size} strokeWidth={2} />;
		case 'variable_set_editor':
			return <Table size={size} strokeWidth={2} />;
		case 'cookie_jar':
			return <CookieIcon size={size} strokeWidth={2} />;
		case 'preferences':
			return <Settings size={size} strokeWidth={2} />;
		case 'new_project_intro':
			return <Sparkles size={size} strokeWidth={2} />;
		case 'project_home':
			return <Home size={size} strokeWidth={2} />;
		case 'variable_input_playground':
			return <FlaskConical size={size} strokeWidth={2} />;
		default:
			return null;
	}
};

/**
 * Mac-style MRU tab cycler. Press Ctrl+Tab to advance through tabs in
 * most-recently-used order; hold Ctrl to keep the overlay visible and tap
 * Tab repeatedly to walk further down the MRU list. Release Ctrl to commit
 * the highlighted tab, Esc to cancel.
 *
 * Sits outside TabView so the listeners can capture keystrokes regardless
 * of which pane has focus.
 */
const MruSwitcher: React.FC = () => {
	const dispatch = useDispatch();
	const activeTabs = useAppSelector(s => s.features.tabs.activeTabs);
	const mruOrder = useAppSelector(s => s.features.tabs.mruOrder);
	const selectedTabPayload = useAppSelector(s => s.features.tabs.selectedTab);
	const tree = useAppSelector(s => s.global.project.tree);
	const projectName = useAppSelector(s => s.global.project.name);
	const workflows = useAppSelector(s => s.global.workflows.workflows);

	const [open, setOpen] = useState(false);
	const [cursor, setCursor] = useState(0);
	const cursorRef = useRef(0);
	const openRef = useRef(false);
	const isDarwin = windowSession.isDarwin();
	const cycleLabel = isDarwin ? 'Shift + Tab to cycle' : 'Ctrl + Tab to cycle';
	const releaseLabel = isDarwin ? 'Release Shift to switch' : 'Release Ctrl to switch';

	useEffect(() => {
		openRef.current = open;
	}, [open]);
	useEffect(() => {
		cursorRef.current = cursor;
	}, [cursor]);

	// MRU order with the currently selected tab pulled to the front (so the
	// first Tab press lands on whatever the user just came from).
	const ordered = useMemo(() => {
		const byPayload = new Map(activeTabs.map(t => [t.payload, t]));
		const seen = new Set<string>();
		const out: TabItem[] = [];

		const push = (payload: string | undefined) => {
			if (!payload || seen.has(payload)) return;
			const tab = byPayload.get(payload);
			if (!tab) return;
			seen.add(payload);
			out.push(tab);
		};

		push(selectedTabPayload);
		for (const p of mruOrder) push(p);
		// Stragglers — tabs that haven't yet entered MRU (initial state)
		// still need a slot so the switcher exposes the entire workspace.
		for (const tab of activeTabs) push(tab.payload);

		return out;
	}, [activeTabs, mruOrder, selectedTabPayload]);

	useEffect(() => {
		function isEditableTarget(target: EventTarget | null): boolean {
			// Shift+Tab is reverse focus traversal and Monaco outdent inside
			// editable surfaces — let those win when the focus is there. The
			// switcher only intercepts when the user is "between" panes (tree
			// focus, sidebar, an empty workbench, etc.).
			if (!(target instanceof HTMLElement)) return false;
			if (target.isContentEditable) return true;
			const tag = target.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
			// Monaco renders into a div with class "monaco-editor"; walk up to
			// catch focus inside the textarea proxy or the suggestion widgets.
			if (target.closest('.monaco-editor')) return true;
			return false;
		}

		function isCycleChord(event: KeyboardEvent): boolean {
			// macOS: Shift+Tab (user preference). Windows/Linux: Ctrl+Tab.
			if (isDarwin) {
				return event.key === 'Tab' && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
			}
			return event.key === 'Tab' && event.ctrlKey && !event.metaKey && !event.altKey;
		}

		function isReleaseKey(event: KeyboardEvent): boolean {
			return isDarwin ? event.key === 'Shift' : event.key === 'Control';
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (isCycleChord(event)) {
				if (ordered.length <= 1) return;
				// On macOS the chord overlaps with reverse focus traversal —
				// defer to the editor/input if that's where focus is.
				if (isDarwin && !openRef.current && isEditableTarget(event.target)) return;

				event.preventDefault();
				event.stopPropagation();

				if (!openRef.current) {
					setOpen(true);
					openRef.current = true;
					// First press: hop straight to the next MRU entry rather
					// than staying on the current tab.
					const first = 1 % ordered.length;
					setCursor(first);
					cursorRef.current = first;
				} else {
					const next = (cursorRef.current + 1) % ordered.length;
					setCursor(next);
					cursorRef.current = next;
				}
				return;
			}

			// While the overlay is open, ArrowUp/ArrowDown gives granular
			// (and reverse) movement — useful because the cycle chord can't
			// carry an additional modifier for reverse on macOS.
			if (openRef.current && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
				event.preventDefault();
				event.stopPropagation();
				const dir = event.key === 'ArrowDown' ? 1 : -1;
				const next = (cursorRef.current + dir + ordered.length) % ordered.length;
				setCursor(next);
				cursorRef.current = next;
				return;
			}

			if (openRef.current && event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				setOpen(false);
				openRef.current = false;
			}
		}

		function handleKeyUp(event: KeyboardEvent) {
			if (!openRef.current) return;
			if (isReleaseKey(event)) {
				openRef.current = false;
				setOpen(false);
				const target = ordered[cursorRef.current];
				if (target && target.payload !== selectedTabPayload) dispatch(changeTab(target));
			}
		}

		function handleBlur() {
			if (!openRef.current) return;
			openRef.current = false;
			setOpen(false);
		}

		document.addEventListener('keydown', handleKeyDown, true);
		document.addEventListener('keyup', handleKeyUp, true);
		window.addEventListener('blur', handleBlur);
		return () => {
			document.removeEventListener('keydown', handleKeyDown, true);
			document.removeEventListener('keyup', handleKeyUp, true);
			window.removeEventListener('blur', handleBlur);
		};
	}, [dispatch, ordered, selectedTabPayload, isDarwin]);

	if (!open || ordered.length === 0) return null;

	return (
		<Portal>
			<Box
				position='fixed'
				inset='0'
				zIndex='9999'
				display='flex'
				alignItems='center'
				justifyContent='center'
				pointerEvents='none'
				bg='color-mix(in srgb, var(--beak-colors-gray-900) 18%, transparent)'
				backdropFilter='blur(2px)'
			>
				<Box
					role='listbox'
					aria-label='Switch tab'
					{...glassChakraProps.dialog}
					borderRadius='lg'
					p='2'
					minW='340px'
					maxW='520px'
					maxH='70vh'
					overflowY='auto'
					pointerEvents='auto'
				>
					<Flex direction='column' gap='0.5'>
						{ordered.map((tab, idx) => {
							const isCursor = idx === cursor;
							const label = describeTab(tab, tree, workflows, projectName);
							return (
								<Flex
									key={`${tab.type}:${String(tab.payload)}`}
									role='option'
									aria-selected={isCursor}
									align='center'
									gap='2'
									px='2'
									py='1.5'
									borderRadius='sm'
									bg={isCursor ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)' : 'transparent'}
									borderWidth='1px'
									borderStyle='solid'
									borderColor={isCursor ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)' : 'transparent'}
								>
									<Box
										as='span'
										display='inline-flex'
										alignItems='center'
										justifyContent='center'
										w='18px'
										h='18px'
										color={isCursor ? 'fg.default' : 'fg.muted'}
									>
										<IconForTab tab={tab} />
									</Box>
									<Flex direction='column' gap='0' minW={0} flex='1'>
										<Box
											as='span'
											fontSize='sm'
											fontWeight='500'
											color={isCursor ? 'fg.default' : 'fg.muted'}
											fontStyle={tab.temporary ? 'italic' : undefined}
											whiteSpace='nowrap'
											overflow='hidden'
											textOverflow='ellipsis'
										>
											{label.title}
										</Box>
										{label.subtitle && (
											<Box
												as='span'
												fontSize='10px'
												color='fg.subtle'
												whiteSpace='nowrap'
												overflow='hidden'
												textOverflow='ellipsis'
											>
												{label.subtitle}
											</Box>
										)}
									</Flex>
								</Flex>
							);
						})}
					</Flex>
					<Flex
						mt='2'
						pt='2'
						borderTopWidth='1px'
						borderTopStyle='solid'
						borderTopColor='border.subtle'
						align='center'
						justify='space-between'
						color='fg.subtle'
						fontSize='10px'
					>
						<Box as='span'>{`${cycleLabel} · ↑↓ to reverse`}</Box>
						<Box as='span'>{`${releaseLabel} · Esc to cancel`}</Box>
					</Flex>
				</Box>
			</Box>
		</Portal>
	);
};

function describeTab(
	tab: TabItem,
	tree: Record<string, { type: string; name?: string }>,
	workflows: Record<string, { name?: string }> | undefined,
	projectName: string | undefined,
): { title: string; subtitle?: string } {
	switch (tab.type) {
		case 'request': {
			const node = tree[tab.payload];
			return { title: node?.name ?? 'Request', subtitle: 'Request' };
		}
		case 'folder_overview': {
			const node = tree[tab.payload];
			return { title: node?.name ?? 'Folder', subtitle: 'Folder' };
		}
		case 'workflow_editor': {
			const wf = workflows?.[tab.payload];
			return { title: wf?.name ?? 'Workflow', subtitle: 'Workflow' };
		}
		case 'variable_set_editor':
			return { title: String(tab.payload), subtitle: 'Variable set' };
		case 'cookie_jar':
			return { title: 'Cookie jars' };
		case 'preferences':
			return { title: 'Preferences' };
		case 'new_project_intro':
			return { title: 'Getting started' };
		case 'project_home':
			return { title: projectName ?? 'Project home' };
		case 'variable_input_playground':
			return { title: 'Variable input lab' };
		default:
			return { title: 'Tab' };
	}
}

export default MruSwitcher;
