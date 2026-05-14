import { Box, Flex, chakra } from '@chakra-ui/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useFlattenedJson, { type JsonRow, type JsonValue } from '../../../hooks/use-flattened-json';
import JsonNodeRow from './JsonNodeRow';
import JsonSearchBar from './JsonSearchBar';
import { toJsPath } from './jsonPath';

const ChakraButton = chakra('button');

interface JsonTreeViewerProps {
	value: JsonValue;
}

const ROW_HEIGHT = 20;

function copyText(text: string) {
	if (typeof navigator !== 'undefined' && navigator.clipboard) {
		navigator.clipboard.writeText(text).catch(() => {});
	}
}

function rowToDragText(row: JsonRow): string {
	if (row.kind === 'primitive') {
		if (row.value === null) return 'null';
		if (typeof row.value === 'string') return row.value;
		return String(row.value);
	}
	return ''; // openers serialize the subtree at top-level
}

const JsonTreeViewer: React.FC<JsonTreeViewerProps> = ({ value }) => {
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
	const [search, setSearch] = useState('');
	const [searchOpen, setSearchOpen] = useState(false);
	const [hitIndex, setHitIndex] = useState(0);

	const scrollRef = useRef<HTMLDivElement>(null);

	const rows = useFlattenedJson(value, { collapsed, searchTerm: searchOpen ? search : '' });

	const hits = useMemo(
		() => rows.map((r, i) => (r.matchesSearch ? i : -1)).filter(i => i >= 0),
		[rows],
	);

	useEffect(() => {
		if (hitIndex >= hits.length) setHitIndex(Math.max(0, hits.length - 1));
	}, [hits.length]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 18,
		getItemKey: i => rows[i]?.id ?? i,
	});

	useEffect(() => {
		if (hits.length === 0) return;
		virtualizer.scrollToIndex(hits[hitIndex], { align: 'center' });
	}, [hitIndex, hits.length]);

	const toggle = useCallback((id: string) => {
		setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
	}, []);

	const onCopyPath = useCallback((path: string[]) => copyText(toJsPath(path)), []);

	const onCopyValue = useCallback((row: JsonRow) => {
		if (row.kind === 'primitive') copyText(rowToDragText(row));
	}, []);

	const onDragValue = useCallback(
		(event: React.DragEvent, row: JsonRow) => {
			let text: string;
			if (row.kind === 'primitive') {
				text = rowToDragText(row);
			} else {
				// serialise the subtree at this path
				try {
					let node: JsonValue = value;
					for (const seg of row.path) {
						if (Array.isArray(node)) node = node[Number(seg)];
						else if (node && typeof node === 'object') node = (node as { [k: string]: JsonValue })[seg];
					}
					text = JSON.stringify(node, null, 2);
				} catch {
					text = '';
				}
			}
			event.dataTransfer.setData('text/plain', text);
			event.dataTransfer.setData('application/x-beak-json-path', toJsPath(row.path));
			event.dataTransfer.effectAllowed = 'copy';
		},
		[value],
	);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
				event.preventDefault();
				setSearchOpen(true);
			} else if (event.key === 'Escape' && searchOpen) {
				event.preventDefault();
				setSearchOpen(false);
				setSearch('');
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [searchOpen]);

	function expandAll() {
		setCollapsed({});
	}

	function collapseAll() {
		// collapse every openable node (those with depth >= 0 + kind opener)
		const next: Record<string, boolean> = {};
		for (const r of rows) {
			if ((r.kind === 'object-open' || r.kind === 'array-open') && r.depth > 0) next[r.id] = true;
		}
		setCollapsed(next);
	}

	return (
		<Box h='100%' display='flex' flexDirection='column' minH={0} bg='bg.canvas'>
			{searchOpen && (
				<JsonSearchBar
					value={search}
					hitCount={hits.length}
					hitIndex={hitIndex}
					onChange={setSearch}
					onNext={() => setHitIndex(i => (hits.length === 0 ? 0 : (i + 1) % hits.length))}
					onPrev={() => setHitIndex(i => (hits.length === 0 ? 0 : (i - 1 + hits.length) % hits.length))}
					onClose={() => {
						setSearchOpen(false);
						setSearch('');
					}}
				/>
			)}

			<Flex
				align='center'
				gap='1'
				px='2'
				py='1'
				fontSize='10px'
				color='fg.subtle'
				borderBottomWidth='1px'
				borderColor='border.subtle'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
			>
				<ChakraButton
					type='button'
					display='inline-flex'
					alignItems='center'
					gap='1'
					px='1.5'
					py='1'
					borderRadius='sm'
					color='fg.subtle'
					bg='transparent'
					border='none'
					fontSize='10px'
					fontWeight='600'
					letterSpacing='0.06em'
					textTransform='uppercase'
					cursor='pointer'
					transition='color .12s ease, background-color .12s ease'
					_hover={{ color: 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)' }}
					_focusVisible={{
						outline: 'none',
						color: 'accent.pink',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
					}}
					onClick={expandAll}
				>
					<ChevronsUpDown size={10} strokeWidth={2.2} />
					{'Expand'}
				</ChakraButton>
				<ChakraButton
					type='button'
					display='inline-flex'
					alignItems='center'
					gap='1'
					px='1.5'
					py='1'
					borderRadius='sm'
					color='fg.subtle'
					bg='transparent'
					border='none'
					fontSize='10px'
					fontWeight='600'
					letterSpacing='0.06em'
					textTransform='uppercase'
					cursor='pointer'
					transition='color .12s ease, background-color .12s ease'
					_hover={{ color: 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)' }}
					_focusVisible={{
						outline: 'none',
						color: 'accent.pink',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
					}}
					onClick={collapseAll}
				>
					<ChevronsDownUp size={10} strokeWidth={2.2} />
					{'Collapse'}
				</ChakraButton>
				<Flex ml='auto' align='center' gap='1' color='fg.subtle' fontSize='10px'>
					<Box
						as='kbd'
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						h='15px'
						minW='15px'
						px='1'
						fontFamily='mono'
						fontSize='10px'
						fontWeight='600'
						borderRadius='sm'
						borderWidth='1px'
						borderColor='border.subtle'
						bg='color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 50%, transparent)'
						color='fg.muted'
					>
						{'⌘F'}
					</Box>
					<Box
						as='span'
						fontWeight='700'
						letterSpacing='0.06em'
						textTransform='uppercase'
					>
						{'Search'}
					</Box>
				</Flex>
			</Flex>

			<Box
				ref={scrollRef}
				flex='1 1 auto'
				overflowY='auto'
				overflowX='hidden'
				css={{
					'&::-webkit-scrollbar': { width: '6px' },
					'&::-webkit-scrollbar-track': { background: 'transparent' },
					'&::-webkit-scrollbar-thumb': {
						background: 'color-mix(in srgb, var(--beak-colors-fg-muted) 22%, transparent)',
						borderRadius: '3px',
					},
					'&::-webkit-scrollbar-thumb:hover': {
						background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
					},
				}}
			>
				<Box position='relative' width='100%' style={{ height: virtualizer.getTotalSize() }}>
					{virtualizer.getVirtualItems().map(v => {
						const row = rows[v.index];
						if (!row) return null;
						const isCurrentHit = hits[hitIndex] === v.index;
						return (
							<Box
								key={row.id}
								position='absolute'
								top={0}
								left={0}
								width='100%'
								style={{ transform: `translateY(${v.start}px)` }}
							>
								<JsonNodeRow
									row={row}
									collapsed={collapsed[row.id] === true}
									highlightSearch={Boolean(row.matchesSearch && isCurrentHit)}
									onToggle={toggle}
									onCopyPath={onCopyPath}
									onCopyValue={onCopyValue}
									onDragValue={onDragValue}
								/>
							</Box>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
};

export default JsonTreeViewer;
