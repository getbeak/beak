import { Box } from '@chakra-ui/react';
import { GripVertical } from 'lucide-react';
import * as React from 'react';

interface EntryDragHandleProps {
	id: string;
	disabled?: boolean;
	dragRef?: (el: HTMLElement | null) => void;
}

/**
 * Drag handle for a JSON entry. Always faintly visible so users can see the
 * row is draggable, with the grip darkening on row hover/focus (the
 * `[data-row-drag]` rule on the Row atom bumps `opacity` to 1). Owns the
 * drag-source ref passed in from `EntryRow` so the drag only initiates when
 * the user grabs the grip — clicks in any other cell still go through to
 * their input.
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
			opacity={0.4}
			transition='opacity .12s ease, color .12s ease'
			_hover={{ color: 'fg.default', opacity: 1 }}
			_active={{ cursor: 'grabbing' }}
		>
			<GripVertical size={12} strokeWidth={2} />
		</Box>
	);
};

export default EntryDragHandle;
