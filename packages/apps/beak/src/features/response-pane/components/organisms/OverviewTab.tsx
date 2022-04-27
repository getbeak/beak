import React from 'react';
import BasicTableEditor from '@beak/app-beak/features/basic-table-editor/components/BasicTableEditor';
import binaryStore from '@beak/app-beak/lib/binary-store';
import { Flight } from '@beak/app-beak/store/flight/types';
import { getStatusReasonPhrase } from '@beak/app-beak/utils/http';
import { ToggleKeyValue } from '@beak/shared-common/types/beak-project';
import prettyBytes from 'pretty-bytes';
import styled from 'styled-components';

export interface OverviewTabProps {
	flight: Flight;
}

const OverviewTab: React.FC<React.PropsWithChildren<OverviewTabProps>> = props => {
	const { flight } = props;

	const { requestStart, responseEnd } = flight.timing;
	const items: Record<string, ToggleKeyValue> = {
		requestMethod: { name: 'Request method', value: [flight.request.verb.toLocaleUpperCase()], enabled: true },
		requestUrl: { name: 'Request url', value: flight.request.url, enabled: true },
		requestStart: { name: 'Request started at', value: [new Date(flight.timing.beakStart).toISOString()], enabled: true },
	};

	if (flight.response) {
		const status = flight.response.status;

		items.responseUrl = { name: 'Response url', value: [flight.response.url ?? ''], enabled: true };
		items.responseStatus = { name: 'Response status', value: [`${status} - ${getStatusReasonPhrase(status)}`], enabled: true };

		if (flight.response.hasBody) {
			const binaryData = binaryStore.get(flight.binaryStoreKey);

			items.responseBodyLength = { name: 'Response body size (friendly)', value: [prettyBytes(binaryData.length)], enabled: true };
			items.responseBodyLengthReal = { name: 'Response body size', value: [`${binaryData.length.toLocaleString()} byte${binaryData.length === 1 ? '' : 's'}`], enabled: true };
		}
	} else {
		items.responseBodyLength = { name: 'Response body size (friendly)', value: ['0 bytes'], enabled: true };
		items.responseBodyLengthReal = { name: 'Response body size', value: ['0 bytes'], enabled: true };
	}

	items.combinedDuration = { name: 'Response duration', value: [calculateDuration(requestStart, responseEnd)], enabled: true };

	return (
		<Container>
			<BasicTableEditor items={items} readOnly />
		</Container>
	);
};

function calculateDuration(start: number | undefined, end: number | undefined) {
	if (start === void 0 || end === void 0)
		return '0 ms';

	return `${end - start} ms`;
}

const Container = styled.div`
	height: 100%;
`;

export default OverviewTab;
