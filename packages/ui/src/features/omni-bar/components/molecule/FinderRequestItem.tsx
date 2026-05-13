import { Box } from '@chakra-ui/react';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import type { RequestOverview } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';
import * as React from 'react';
import { useEffect, useState } from 'react';

export interface FinderRequestItemProps {
	context: Context;
	info: RequestOverview;
}

const FinderRequestItem: React.FC<FinderRequestItemProps> = ({ context, info }) => {
	const [uri, setUri] = useState('');

	useEffect(() => {
		convertRequestToUrl(context, info).then(s => setUri(s.toString()));
	}, [context, info]);

	return (
		<Box as='small' opacity={0.4}>
			<div
				data-tooltip-id='tt-omni-bar-finder-request-uri'
				data-tooltip-content={uri}
				data-tooltip-hidden={uri.length < 100}
			>
				{uri}
			</div>
		</Box>
	);
};

export default FinderRequestItem;
