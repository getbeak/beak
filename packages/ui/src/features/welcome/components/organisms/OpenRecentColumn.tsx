import React, { useEffect, useState } from 'react';
import { RecentProject } from '@beak/common/types/beak-hub';
import NewsBannerContainer from '@beak/ui/features/news-banner/components/NewsBannerContainer';
import { ipcBeakHubService, ipcProjectService } from '@beak/ui/lib/ipc';
import { sortIso8601 } from '@beak/ui/utils/sort';
import { sentenceCase } from 'change-case';
import styled from 'styled-components';

import ColumnTitle from '../atoms/ColumnTitle';
import Collapse from '../molecules/Collapse';
import RecentEntry from '../molecules/RecentEntry';

type TimeCategory = 'today' | 'week' | 'month' | 'older';
type Recents = Record<TimeCategory, RecentProject[]>;

const categories: TimeCategory[] = ['today', 'week', 'month', 'older'];

const OpenRecentColumn: React.FC<React.PropsWithChildren<unknown>> = () => {
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

					if (diff > 2592000) // 1 month
						newRecents.older.push(m);
					else if (diff > 604800) // 1 week
						newRecents.month.push(m);
					else if (diff > 86400) // 1 day
						newRecents.week.push(m);
					else
						newRecents.today.push(m);
				});

			setRecents(newRecents);
		});
	}, []);

	const noRecents = checkIfNoRecents(recents);

	return (
		<Wrapper>
			<NewsBannerContainer />

			<ColumnTitle>{'Open recent'}</ColumnTitle>
			<ScrollViewer tabIndex={-1}>
				<ScrollViewerInner tabIndex={-1}>
					{noRecents && 'No recent projects, create one to get started'}
					{categories.filter(k => recents[k].length > 0).map(k => (
						<Collapse
							key={k}
							startOpen={true}
							title={sentenceCase(k)}
						>
							{recents[k].sort(sortIso8601(r => r.accessTime, 'desc')).map(m => (
								<RecentEntry
									key={`${m.name}-${m.path}`}
									modifiedDate={m.accessTime}
									name={m.name}
									path={m.path}
									type={'local'}

									onClick={() => {
										ipcProjectService.openFolder(m.path);
									}}
								/>
							))}
						</Collapse>
					))}
				</ScrollViewerInner>
			</ScrollViewer>
		</Wrapper>
	);
};

function defaultRecents(): Recents {
	return {
		today: [],
		week: [],
		month: [],
		older: [],
	};
}

function checkIfNoRecents(recents: Recents) {
	const hasToday = recents.today.length > 0;
	const hasWeek = recents.week.length > 0;
	const hasMonth = recents.month.length > 0;
	const hasOlder = recents.older.length > 0;

	return !hasToday && !hasWeek && !hasMonth && !hasOlder;
}

const Wrapper = styled.div`
	flex-basis: 60%;
	height: 100%;
	display: flex;
	flex-direction: column;
`;

const ScrollViewer = styled.div`
	flex: 1 1 auto;
	overflow-y: scroll;
`;

const ScrollViewerInner = styled.div`

`;

export default OpenRecentColumn;
