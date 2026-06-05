import { Box, chakra } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import { Row } from '../atoms/Structure';

interface EntryEmptyStateProps {
	parentId: string;
	parentType: 'object' | 'array';
	depth: number;
}

const Button = chakra('button');

/**
 * Persistent "add the first child" call-to-action that renders inside an
 * empty object or array. Lives in the same grid as a regular row so it sits
 * visually flush with the rest of the table, but spans the full row width.
 *
 * Pre-redesign the only affordance was the hover-only `+` icon in the action
 * column — discoverable for power users, but invisible for someone landing
 * on an empty body. This puts the action where the eye naturally goes (the
 * empty interior of the container) and removes the hover gate.
 */
const EntryEmptyState: React.FC<EntryEmptyStateProps> = ({ parentId, parentType, depth }) => {
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;

	const label = parentType === 'array' ? 'Add first item' : 'Add first field';

	// In `valuesOnly` mode the schema is locked — the user can't add entries,
	// so the empty container reads as a passive "(empty)" hint instead of an
	// add-first call to action.
	if (editorContext.valuesOnly) {
		const hint = parentType === 'array' ? '(empty array)' : '(empty object)';
		return (
			<Row data-empty='true' style={{ gridTemplateColumns: '1fr' }}>
				<Box
					as='span'
					display='inline-flex'
					alignItems='center'
					h='28px'
					color='fg.subtle'
					fontSize='11.5px'
					fontStyle='italic'
					style={{ paddingLeft: `${54 + depth * 12}px` }}
				>
					{hint}
				</Box>
			</Row>
		);
	}

	return (
		<Row data-empty='true' style={{ gridTemplateColumns: '1fr' }}>
			<Button
				type='button'
				onClick={() => dispatch(editorContext.addEntry({ requestId: editorContext.requestId, id: parentId }))}
				display='inline-flex'
				alignItems='center'
				gap='1.5'
				h='28px'
				border='none'
				background='transparent'
				cursor='pointer'
				color='fg.subtle'
				fontSize='11.5px'
				fontWeight='500'
				letterSpacing='0.01em'
				transition='color .12s ease, background-color .12s ease'
				// 46px = folder (18) + toggle (28) grid gutter; +8 lines the icon
				// up with the "Key" header label and the key inputs in real rows
				// (BodyInputWrapper applies an 8px inner padding to inputs).
				style={{ paddingLeft: `${54 + depth * 12}px`, paddingRight: '12px' }}
				_hover={{
					color: 'accent.pink',
					background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 6%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					color: 'accent.pink',
					boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 38%, transparent)',
				}}
			>
				<Plus size={11} strokeWidth={2.2} />
				<span>{label}</span>
			</Button>
		</Row>
	);
};

export default EntryEmptyState;
