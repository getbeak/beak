import { Box, Flex, chakra } from '@chakra-ui/react';
import { ChevronRight, Copy, Link2 } from 'lucide-react';
import * as React from 'react';

import type { JsonRow } from '../../../hooks/use-flattened-json';
import { toJsPath } from './jsonPath';

interface JsonNodeRowProps {
	row: JsonRow;
	collapsed: boolean;
	highlightSearch: boolean;
	onToggle: (id: string) => void;
	onCopyPath: (path: string[]) => void;
	onCopyValue: (row: JsonRow) => void;
	onDragValue: (event: React.DragEvent, row: JsonRow) => void;
}

const ChakraButton = chakra('button');

const TYPE_COLOURS: Record<NonNullable<JsonRow['valueType']>, string> = {
	string: 'var(--beak-colors-accent-teal)',
	number: 'var(--beak-colors-accent-indigo)',
	boolean: 'var(--beak-colors-accent-warning)',
	null: 'var(--beak-colors-fg-subtle)',
};

function formatPrimitive(row: JsonRow): string {
	if (row.value === null) return 'null';
	if (typeof row.value === 'string') return JSON.stringify(row.value);
	return String(row.value);
}

const JsonNodeRow: React.FC<JsonNodeRowProps> = ({
	row,
	collapsed,
	highlightSearch,
	onToggle,
	onCopyPath,
	onCopyValue,
	onDragValue,
}) => {
	const indent = row.depth * 12 + 6;
	const isOpener = row.kind === 'object-open' || row.kind === 'array-open';
	const isCloser = row.kind === 'object-close' || row.kind === 'array-close';
	const collapsible = isOpener;

	const bracketOpen = row.kind === 'array-open' || row.kind === 'array-close' ? '[' : '{';
	const bracketClose = row.kind === 'array-open' || row.kind === 'array-close' ? ']' : '}';

	function renderKey() {
		if (row.keyKind === 'object-key') {
			return (
				<Box as='span' color='accent.pink' fontWeight='500'>
					{JSON.stringify(row.key)}
					<Box as='span' color='fg.subtle'>{': '}</Box>
				</Box>
			);
		}
		if (row.keyKind === 'array-index') {
			return (
				<Box as='span' color='fg.subtle'>
					{`${row.key}: `}
				</Box>
			);
		}
		return null;
	}

	return (
		<Flex
			align='center'
			fontFamily='mono'
			fontSize='12px'
			lineHeight='20px'
			h='20px'
			pl='1'
			pr='2'
			position='relative'
			color='fg.muted'
			role='row'
			draggable={row.kind === 'primitive' || isOpener}
			onDragStart={e => onDragValue(e, row)}
			_hover={{
				bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 35%, transparent)',
			}}
			css={{
				'&:hover .json-row-actions': { opacity: 1 },
				...(highlightSearch
					? {
						background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 24%, transparent)',
						boxShadow: 'inset 2px 0 0 var(--beak-colors-accent-pink)',
					}
					: {}),
			}}
			style={{ paddingLeft: `${indent}px` }}
		>
			{/* depth guides */}
			{row.depth > 0 && (
				<Box position='absolute' top={0} bottom={0} left={0} pointerEvents='none' aria-hidden>
					{Array.from({ length: row.depth }).map((_, i) => (
						<Box
							// biome-ignore lint/suspicious/noArrayIndexKey: stable
							key={i}
							position='absolute'
							top={0}
							bottom={0}
							width='1px'
							style={{ left: `${i * 12 + 9}px` }}
							bg='border.subtle'
							opacity={0.45}
						/>
					))}
				</Box>
			)}

			{collapsible ? (
				<ChakraButton
					type='button'
					aria-label={collapsed ? 'Expand' : 'Collapse'}
					mr='1'
					w='12px'
					h='12px'
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					color='fg.subtle'
					bg='transparent'
					border='none'
					p='0'
					cursor='pointer'
					transform={collapsed ? 'rotate(0deg)' : 'rotate(90deg)'}
					transition='transform .14s ease-out, color .12s ease'
					_hover={{ color: 'accent.pink' }}
					onClick={() => onToggle(row.id)}
				>
					<ChevronRight size={10} strokeWidth={2.2} />
				</ChakraButton>
			) : (
				<Box w='12px' mr='1' aria-hidden />
			)}

			<Box as='span' display='inline-flex' alignItems='center' minW={0} flex='1 1 auto' gap='0'>
				{!isCloser && renderKey()}

				{row.kind === 'primitive' && (
					<Box
						as='span'
						overflow='hidden'
						textOverflow='ellipsis'
						whiteSpace='nowrap'
						style={{ color: TYPE_COLOURS[row.valueType ?? 'null'] }}
					>
						{formatPrimitive(row)}
					</Box>
				)}

				{isOpener && !collapsed && (
					<Box as='span' color='fg.subtle'>{bracketOpen}</Box>
				)}

				{isOpener && collapsed && (
					<Box as='span' color='fg.subtle'>
						{bracketOpen}
						<Box as='span' color='fg.subtle' fontStyle='italic' mx='1'>
							{row.kind === 'array-open'
								? `${row.childCount} item${row.childCount === 1 ? '' : 's'}`
								: `${row.childCount} key${row.childCount === 1 ? '' : 's'}`}
						</Box>
						{bracketClose}
					</Box>
				)}

				{isCloser && (
					<Box as='span' color='fg.subtle'>{bracketClose}</Box>
				)}
			</Box>

			{/* hover actions */}
			<Flex
				className='json-row-actions'
				gap='0.5'
				opacity={0}
				transition='opacity .12s ease'
				align='center'
				ml='2'
			>
				<ChakraButton
					type='button'
					aria-label='Copy path'
					title={`Copy path: ${toJsPath(row.path)}`}
					color='fg.subtle'
					bg='transparent'
					border='none'
					p='1'
					borderRadius='sm'
					cursor='pointer'
					_hover={{ color: 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 15%, transparent)' }}
					onClick={() => onCopyPath(row.path)}
				>
					<Link2 size={10} />
				</ChakraButton>
				{row.kind === 'primitive' && (
					<ChakraButton
						type='button'
						aria-label='Copy value'
						title='Copy value'
						color='fg.subtle'
						bg='transparent'
						border='none'
						p='1'
						borderRadius='sm'
						cursor='pointer'
						_hover={{ color: 'accent.teal', bg: 'color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)' }}
						onClick={() => onCopyValue(row)}
					>
						<Copy size={10} />
					</ChakraButton>
				)}
			</Flex>
		</Flex>
	);
};

export default React.memo(JsonNodeRow);
