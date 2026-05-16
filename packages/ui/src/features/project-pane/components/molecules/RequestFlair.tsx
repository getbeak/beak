import AlertFlair from '@beak/ui/features/alerts/components/AlertFlair';
import type { TreeViewItem } from '@beak/ui/features/tree-view/types';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

import RequestFlightStatus from './RequestFlightStatus';

interface RequestFlairProps {
	node: TreeViewItem;
}

/**
 * Right-side flair for a request row in the sidebar tree. The linked-to-
 * spec indicator now rides on the row's leading icon (the verb-coloured
 * `Link2` in `NodeName`) — this column only carries the alert popover,
 * the dirty-edits dot, and the flight-status indicator.
 */
const RequestFlair: React.FC<RequestFlairProps> = ({ node }) => {
	const isDirty = useAppSelector(s => Boolean(s.global.project.linkedDirty[node.id]));

	return (
		<Flex align='center' gap='1'>
			<AlertFlair requestId={node.id} size={12} interactive />
			{isDirty && (
				<Box
					as='span'
					w='6px'
					h='6px'
					borderRadius='full'
					bg='accent.alert'
					title='Unsaved edits — unlink to persist'
					aria-label='Unsaved edits'
				/>
			)}
			<RequestFlightStatus node={node} />
		</Flex>
	);
};

export default RequestFlair;
