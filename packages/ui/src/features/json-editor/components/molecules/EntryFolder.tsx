import { Box } from '@chakra-ui/react';
import SelectedNodeContext from '@beak/ui/features/request-pane/contexts/selected-node';
import { requestPreferenceSetReqJsonExpand } from '@beak/ui/store/preferences/actions';
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

	return (
		<Box
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
			onClick={() => {
				dispatch(requestPreferenceSetReqJsonExpand({ id: node.id, jsonId: id, expanded: !expanded }));
				onChange(!expanded);
			}}
		>
			<ChevronRight size={10} strokeWidth={2.2} />
		</Box>
	);
};

export const EntryFolderIrrelevant: React.FC = () => <Box display='inline-block' w='16px' h='20px' />;

export default EntryFolder;
