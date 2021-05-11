import { ipcBeakHubService, ipcProjectService } from '@beak/app/lib/ipc';
import { RecentLocalProject } from '@beak/common/types/beak-hub';
import { sentenceCase } from 'change-case';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import ColumnTitle from '../atoms/ColumnTitle';
import Collapse from '../molecules/Collapse';
import RecentEntry from '../molecules/RecentEntry';

type TimeCategory = 'today' | 'week' | 'month' | 'older';
type Recents = Record<TimeCategory, RecentLocalProject[]>;

const categories: TimeCategory[] = ['today', 'week', 'month', 'older'];

const OpenRecentColumn: React.FunctionComponent = () => {
	const [recents, setRecents] = useState<Recents>({ ...defaultRecents() });

	useEffect(() => {
		ipcBeakHubService.listRecentProjects().then(recents => {
			const newRecents = { ...defaultRecents() };
			const now = new Date().getTime() / 1000;

			recents.filter(r => r.exists)
				.sort((a, b) => {
					const aD = new Date(a.modifiedTime).getTime();
					const bD = new Date(b.modifiedTime).getTime();

					return Math.sign(aD - bD);
				})
				.forEach(m => {
					const unix = new Date(m.modifiedTime).getTime() / 1000;
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
			<ColumnTitle>{'Open recent'}</ColumnTitle>

			<ScrollViewer>
				{noRecents && 'No recent projects, why not make one?'}
				{categories.filter(k => recents[k].length > 0).map(k => (
					<Collapse
						key={k}
						startOpen={true}
						title={sentenceCase(k)}
					>
						{recents[k].map(m => (
							<RecentEntry
								key={`${m.name}-${m.path}`}
								modifiedDate={m.modifiedTime}
								name={m.name}
								path={m.path}
								type={m.type}

								onClick={() => {
									ipcProjectService.openFolder(m.path);
								}}
							/>
						))}
					</Collapse>
				))}
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

const Wrapper = styled.div``;

const ScrollViewer = styled.div`
	height: 100%;

	overflow: scroll;
	overflow-y: scroll;
	overflow-x: hidden;
`;

export default OpenRecentColumn;
