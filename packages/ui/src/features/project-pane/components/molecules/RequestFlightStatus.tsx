import { TypedObject } from '@beak/common/helpers/typescript';
import { statusToColor } from '@beak/design-system/helpers';
import type { TreeViewItem } from '@beak/ui/features/tree-view/types';
import { useAppSelector } from '@beak/ui/store/redux';
import React from 'react';
import styled from 'styled-components';

interface RequestFlightStatusProps {
	node: TreeViewItem;
}

const RequestFlightStatus: React.FC<React.PropsWithChildren<RequestFlightStatusProps>> = ({ node }) => {
	const flight = useAppSelector(s => s.global.flight.flightHistories[node.id]);
	let mostRecentFlight: number | undefined;

	if (flight?.history) {
		const flightHistories = TypedObject.values(flight.history);
		const lastIndex = flightHistories.length - 1;

		if (lastIndex > -1) mostRecentFlight = flightHistories[lastIndex]?.response?.status;
	}

	if (mostRecentFlight === void 0) return null;

	return <RequestStatusBlob $status={mostRecentFlight} />;
};

interface RequestStatusBlobProps {
	$status: number;
}

const RequestStatusBlob = styled.div<RequestStatusBlobProps>`
	width: 9px; height: 9px;

	border: 1px solid var(--beak-colors-border-subtle);
	border-radius: 100%;

	background-color: ${p => statusToColor(p.theme, p.$status)};
`;

export default RequestFlightStatus;
