import { TypedObject } from '@beak/common/helpers/typescript';
import { statusToColor } from '@beak/design-system/helpers';
import type { TreeViewItem } from '@beak/ui/features/tree-view/types';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
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

	const color = statusToColor(mostRecentFlight);

	return (
		<Box
			role='img'
			aria-label={`Last response status ${mostRecentFlight}`}
			title={`Last response: HTTP ${mostRecentFlight}`}
			w='8px'
			h='8px'
			borderRadius='full'
			style={{
				backgroundColor: color,
				boxShadow: `0 0 0 1.5px color-mix(in srgb, ${color} 24%, transparent), 0 0 6px color-mix(in srgb, ${color} 40%, transparent)`,
			}}
		/>
	);
};

export default RequestFlightStatus;
