import SelectedNodeContext from '@beak/ui/features/request-pane/contexts/selected-node';
import { requestPreferenceSetReqJsonExpand } from '@beak/ui/store/preferences/actions';
import { Box } from '@chakra-ui/react';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';

interface EntryFolderProps {
	id: string;
	requestId: string;
	expanded?: boolean;
	onChange: (expanded: boolean) => void;
}

const EntryFolder: React.FC<EntryFolderProps> = ({ expanded, id, onChange }) => {
	const dispatch = useDispatch();
	const node = useContext(SelectedNodeContext);

	function toggle() {
		if (!node) return;
		dispatch(requestPreferenceSetReqJsonExpand({ id: node.id, jsonId: id, expanded: !expanded }));
		onChange(!expanded);
	}

	return (
		<Box
			role='button'
			tabIndex={0}
			aria-label={expanded ? 'Collapse' : 'Expand'}
			aria-expanded={expanded}
			display='inline-flex'
			alignItems='center'
			justifyContent='center'
			w='16px'
			h='20px'
			cursor='pointer'
			color='fg.subtle'
			borderRadius='sm'
			transform={expanded ? 'rotate(90deg)' : 'rotate(0deg)'}
			transition='background-color .12s ease, color .12s ease, transform .14s ease-out'
			_hover={{
				color: 'accent.pink',
			}}
			_focusVisible={{
				outline: 'none',
				color: 'accent.pink',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
			}}
			onClick={toggle}
			onKeyDown={event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					toggle();
				}
			}}
		>
			<ChevronRight size={10} strokeWidth={2.2} />
		</Box>
	);
};

export default EntryFolder;
