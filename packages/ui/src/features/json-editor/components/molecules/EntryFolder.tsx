import { Box } from '@chakra-ui/react';
import SelectedNodeContext from '@beak/ui/features/request-pane/contexts/selected-node';
import { requestPreferenceSetReqJsonExpand } from '@beak/ui/store/preferences/actions';
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
			mt='0.5'
			w='15px'
			onClick={() => {
				dispatch(requestPreferenceSetReqJsonExpand({ id: node.id, jsonId: id, expanded: !expanded }));
				onChange(!expanded);
			}}
		>
			<Box
				display='inline-block'
				borderRight='1px solid'
				borderRightColor='fg.default'
				borderBottom='1px solid'
				borderBottomColor='fg.default'
				w='5px'
				h='5px'
				transformOrigin='50%'
				transform={expanded ? 'rotate(45deg)' : 'rotate(-45deg)'}
				mb={expanded ? '0.5' : '0'}
				ml='1.5'
			/>
		</Box>
	);
};

export const EntryFolderIrrelevant: React.FC = () => <Box mt='0.5' w='15px' />;

export default EntryFolder;
