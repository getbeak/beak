import { Box } from '@chakra-ui/react';
import SelectedNodeContext from '@beak/ui/features/request-pane/contexts/selected-node';
import { requestPreferenceSetReqJsonExpand } from '@beak/ui/store/preferences/actions';
import { motion } from 'framer-motion';
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
			color='fg.muted'
			borderRadius='sm'
			transition='background-color .12s ease, color .12s ease'
			_hover={{
				color: 'fg.default',
				bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 50%, transparent)',
			}}
			onClick={() => {
				dispatch(requestPreferenceSetReqJsonExpand({ id: node.id, jsonId: id, expanded: !expanded }));
				onChange(!expanded);
			}}
		>
			<motion.span
				style={{ display: 'inline-flex', transformOrigin: 'center' }}
				animate={{ rotate: expanded ? 90 : 0 }}
				transition={{ duration: 0.14, ease: 'easeOut' }}
			>
				<ChevronRight size={10} />
			</motion.span>
		</Box>
	);
};

export const EntryFolderIrrelevant: React.FC = () => <Box display='inline-block' w='16px' h='20px' />;

export default EntryFolder;
