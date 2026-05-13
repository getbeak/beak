import { Box, Button, Flex } from '@chakra-ui/react';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import useShareLink from '@beak/ui/hooks/use-share-link';
import { Copy, Share } from 'lucide-react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useContext } from 'react';

import { createBasicHttpOutput } from '../molecules/RequestOutput';

interface RequestPaneSplitterProps {
	selectedNode: ValidRequestNode;
}

const RequestPaneSplitter: React.FC<RequestPaneSplitterProps> = ({ selectedNode }) => {
	const context = useVariableContext(selectedNode.id);
	const windowSession = useContext(WindowSessionContext);
	const shareUrl = useShareLink(selectedNode.id);

	function copyRequestPreview() {
		createBasicHttpOutput(selectedNode.info, context, windowSession).then(output =>
			navigator.clipboard.writeText(output),
		);
	}

	return (
		<Flex
			justify='space-between'
			align='center'
			bg='bg.canvas'
			borderTopWidth='1px'
			borderBottomWidth='1px'
			borderColor='border.default'
			px='2'
			py='1.5'
		>
			<Box fontSize='md' color='fg.default'>{'Request preview'}</Box>
			<Flex pointerEvents='all'>
				<Button bg='none' border='none' color='fg.default' fontSize='xs' lineHeight='12px' cursor='pointer' px='1.5' py='0' h='auto' onClick={copyRequestPreview}>
					<Copy id='tt-request-preview-copy' />
				</Button>
				<Box mx='1.5' w='1px' bg='border.default' />
				<Button bg='none' border='none' color='fg.default' fontSize='xs' lineHeight='12px' cursor='pointer' px='1.5' py='0' h='auto' onClick={() => navigator.clipboard.writeText(shareUrl)}>
					<Share id='tt-request-preview-share' />
				</Button>
			</Flex>
		</Flex>
	);
};

export default RequestPaneSplitter;
