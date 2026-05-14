import { Flex, IconButton } from '@chakra-ui/react';
import type { Entries } from '@getbeak/types/body-editor-json';
import { Minus, Plus } from 'lucide-react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';

interface EntryActionsProps {
	requestId: string;
	id: string;
	entry: Entries;
}

const EntryActions: React.FC<EntryActionsProps> = ({ requestId, id, entry }) => {
	const isRoot = entry.parentId === null;
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;

	// Don't show any icons for root level primitives
	if (isRoot && !['array', 'object'].includes(entry.type)) return null;

	return (
		<Flex h='100%' direction='row' justify='flex-end' align='center' gap='0.5'>
			{!isRoot && (
				<IconButton
					aria-label='Remove entry'
					title='Remove entry'
					size='xs'
					variant='ghost'
					color='fg.subtle'
					tabIndex={-1}
					h='18px'
					w='18px'
					minW='18px'
					borderRadius='sm'
					_hover={{
						color: 'accent.alert',
						bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 18%, transparent)',
					}}
					_focusVisible={{
						outline: 'none',
						color: 'accent.alert',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-alert) 45%, transparent)',
					}}
					_active={{ transform: 'scale(0.92)' }}
					transition='color .12s ease, background-color .12s ease, transform .08s ease'
					onClick={() => dispatch(editorContext.removeEntry({ id, requestId }))}
				>
					<Minus size={11} strokeWidth={2.4} />
				</IconButton>
			)}
			<IconButton
				aria-label='Add entry'
				title='Add entry'
				size='xs'
				variant='ghost'
				color='fg.subtle'
				tabIndex={-1}
				h='18px'
				w='18px'
				minW='18px'
				borderRadius='sm'
				_hover={{
					color: 'accent.pink',
					bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					color: 'accent.pink',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
				}}
				_active={{ transform: 'scale(0.92)' }}
				transition='color .12s ease, background-color .12s ease, transform .08s ease'
				onClick={() => dispatch(editorContext.addEntry({ id, requestId }))}
			>
				<Plus size={11} strokeWidth={2.4} />
			</IconButton>
		</Flex>
	);
};

export default EntryActions;
