import React, { useEffect, useState } from 'react';
import { convertRequestToUrl } from '@beak/ui/utils/uri';
import type { RequestOverview } from '@getbeak/types/request';
import type { Context } from '@getbeak/types/values';
import styled from 'styled-components';

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
		<UriSpan>
			<div
				data-tooltip-id={'tt-omni-bar-finder-request-uri'}
				data-tooltip-content={uri}
				data-tooltip-hidden={uri.length < 100}
			>
				{uri}
			</div>
		</UriSpan>
	);
};

const UriSpan = styled.small`
	opacity: .4;
`;

export default FinderRequestItem;
