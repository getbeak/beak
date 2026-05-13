import { Box } from '@chakra-ui/react';
import type { NewsItem, NewsItemType } from '@beak/common/types/nest';
import { ipcNestService } from '@beak/ui/lib/ipc';
import React, { useEffect, useState } from 'react';

import GenericBanner from './molecules/GenericBanner';

const supportedCodes = ['generic_banner'];

const NewsBannerContainer: React.FC = () => {
	const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

	useEffect(() => {
		ipcNestService
			.listNewsItems()
			.then(setNewsItems)
			.catch(() => {
				/*  */
			});
	}, []);

	if (newsItems.length === 0) return null;

	return (
		<Box>
			{newsItems.map(n => {
				let renderItem: NewsItemType | undefined = void 0;
				const primaryCode = n.primary.code;
				const hasFallback = Boolean(n.fallback);
				const supported = supportedCodes.includes(primaryCode);

				if (supported) renderItem = n.primary;
				else if (hasFallback && supportedCodes.includes(n.fallback!.code)) renderItem = n.fallback!;

				if (!renderItem) return null;

				switch (renderItem.code) {
					case 'generic_banner':
						return <GenericBanner key={n.id} item={renderItem} />;
					default:
						return null;
				}
			})}
		</Box>
	);
};

export default NewsBannerContainer;
