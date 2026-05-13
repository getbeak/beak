import { Box } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { statusToColor } from '@beak/design-system/helpers';
import type { TreeViewItem } from '@beak/ui/features/tree-view/types';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';

interface RequestFlightStatusProps {
	node: TreeViewItem;
}

const RequestFlightStatus: React.FC<RequestFlightStatusProps> = ({ node }) => {
	const flight = useAppSelector(s => s.global.flight.flightHistories[node.id]);
	let mostRecentFlight: number | undefined;

	if (flight?.history) {
		const flightHistories = TypedObject.values(flight.history);
		const lastIndex = flightHistories.length - 1;

		if (lastIndex > -1) mostRecentFlight = flightHistories[lastIndex]?.response?.status;
	}

	if (mostRecentFlight === void 0) return null;

	return (
		<Box
			w='9px'
			h='9px'
			borderWidth='1px'
			borderColor='border.subtle'
			borderRadius='full'
			style={{ backgroundColor: statusToColor(mostRecentFlight) }}
		/>
	);
};

export default RequestFlightStatus;
