import { Box } from '@chakra-ui/react';
import { GripVertical } from 'lucide-react';
import * as React from 'react';

interface EntryDragHandleProps {
	id: string;
	disabled?: boolean;
	dragRef?: (el: HTMLElement | null) => void;
}

/**
 * Drag handle for a JSON entry. Hidden until the row is hovered or focused
 * (see the `[data-row-drag]` rules on the Row atom). Owns the drag-source ref
 * passed in from `EntryRow` so the drag only initiates when the user grabs
 * the grip — clicks in any other cell still go through to their input.
 */
const EntryDragHandle: React.FC<EntryDragHandleProps> = ({ disabled, dragRef }) => {
	if (disabled) return <Box data-row-drag='' opacity={0} />;
	return (
		<Box
			ref={dragRef as unknown as React.Ref<HTMLDivElement>}
			data-row-drag=''
			role='button'
			tabIndex={-1}
			aria-label='Drag entry to reorder'
			display='flex'
			alignItems='center'
			justifyContent='center'
			cursor='grab'
			color='fg.subtle'
			opacity={0}
			transition='opacity .12s ease, color .12s ease'
			_hover={{ color: 'fg.default' }}
			_active={{ cursor: 'grabbing' }}
		>
			<GripVertical size={12} strokeWidth={2} />
		</Box>
	);
};

export default EntryDragHandle;
