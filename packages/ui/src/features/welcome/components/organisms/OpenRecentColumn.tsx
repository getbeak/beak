import { Box, Flex } from '@chakra-ui/react';
import type { RecentProject } from '@beak/common/types/beak-hub';
import NewsBannerContainer from '@beak/ui/features/news-banner/components/NewsBannerContainer';
import { ipcBeakHubService, ipcProjectService } from '@beak/ui/lib/ipc';
import { sortIso8601 } from '@beak/ui/utils/sort';
import { sentenceCase } from 'change-case';
import * as React from 'react';
import { useEffect, useState } from 'react';

import ColumnTitle from '../atoms/ColumnTitle';
import Collapse from '../molecules/Collapse';
import RecentEntry from '../molecules/RecentEntry';

type TimeCategory = 'today' | 'week' | 'month' | 'older';
type Recents = Record<TimeCategory, RecentProject[]>;

const categories: TimeCategory[] = ['today', 'week', 'month', 'older'];

const OpenRecentColumn: React.FC = () => {
	const [recents, setRecents] = useState<Recents>({ ...defaultRecents() });

	useEffect(() => {
		ipcBeakHubService.listRecentProjects().then(recents => {
			const newRecents = { ...defaultRecents() };
			const now = new Date().getTime() / 1000;

			recents
				.sort((a, b) => {
					const aD = new Date(a.accessTime).getTime();
					const bD = new Date(b.accessTime).getTime();
					return Math.sign(aD - bD);
				})
				.forEach(m => {
					const unix = new Date(m.accessTime).getTime() / 1000;
					const diff = now - unix;

					if (diff > 2592000) newRecents.older.push(m);
					else if (diff > 604800) newRecents.month.push(m);
					else if (diff > 86400) newRecents.week.push(m);
					else newRecents.today.push(m);
				});

			setRecents(newRecents);
		});
	}, []);

	const noRecents = checkIfNoRecents(recents);

	return (
		<Flex flexBasis='60%' h='100%' direction='column'>
			<NewsBannerContainer />
			<ColumnTitle>{'Open recent'}</ColumnTitle>
			<Box flex='1 1 auto' overflowY='scroll' tabIndex={-1}>
				<Box tabIndex={-1}>
					{noRecents && 'No recent projects, create one to get started'}
					{categories
						.filter(k => recents[k].length > 0)
						.map(k => (
							<Collapse key={k} startOpen={true} title={sentenceCase(k)}>
								{recents[k].sort(sortIso8601(r => r.accessTime, 'desc')).map(m => (
									<RecentEntry
										key={`${m.name}-${m.path}`}
										modifiedDate={m.accessTime}
										name={m.name}
										path={m.path}
										type='local'
										onClick={() => {
											ipcProjectService.openFolder(m.path);
										}}
									/>
								))}
							</Collapse>
						))}
				</Box>
			</Box>
		</Flex>
	);
};

function defaultRecents(): Recents {
	return { today: [], week: [], month: [], older: [] };
}

function checkIfNoRecents(recents: Recents) {
	return !recents.today.length && !recents.week.length && !recents.month.length && !recents.older.length;
}

export default OpenRecentColumn;
