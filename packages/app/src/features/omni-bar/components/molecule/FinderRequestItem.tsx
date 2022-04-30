import React, { useEffect, useState } from 'react';
import { convertRequestToUrl } from '@beak/app/utils/uri';
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
			<Abbr title={uri}>
				{uri}
			</Abbr>
		</UriSpan>
	);
};

const UriSpan = styled.small`
	opacity: 0.6;
`;

const Abbr = styled.abbr`
	text-decoration: none;
`;

export default FinderRequestItem;
