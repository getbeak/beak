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
		let cancelled = false;
		convertRequestToUrl(context, info).then(s => {
			if (!cancelled) setUri(s.toString());
		});
		return () => {
			cancelled = true;
		};
	}, [context, info]);

	return (
		<Box
			as='small'
			color='fg.subtle'
			fontFamily='mono'
			fontSize='10px'
			letterSpacing='0.01em'
			lineHeight='1.4'
		>
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
