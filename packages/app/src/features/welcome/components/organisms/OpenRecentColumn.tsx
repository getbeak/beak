import { RecentLocalProject } from '@beak/common/types/beak-hub';
import { sentenceCase } from 'change-case';
import React, { useEffect, useState } from 'react';
import { Col } from 'react-grid-system';
import styled from 'styled-components';

import ColumnTitle from '../atoms/ColumnTitle';
import Collapse from '../molecules/Collapse';
import RecentEntry from '../molecules/RecentEntry';

type TimeCategory = 'today' | 'week' | 'month' | 'older';
type Recents = Record<TimeCategory, RecentLocalProject[]>;

const categories: TimeCategory[] = ['today', 'week', 'month', 'older'];

const defaultRecents: Recents = {
	today: [],
	week: [],
	month: [],
	older: [],
};

const electron = window.require('electron');
const { ipcRenderer } = electron;

const OpenRecentColumn: React.FunctionComponent = () => {
	const [recents, setRecents] = useState<Recents>({ ...defaultRecents });

	useEffect(() => {
		ipcRenderer.invoke('beak_hub:list_recents').then((recents: RecentLocalProject[]) => {
			const newRecents = { ...defaultRecents };
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

	return (
		<Col>
			<ColumnTitle>{'Open recent'}</ColumnTitle>

			<ScrollViewer>
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
									ipcRenderer.invoke('project:open_folder', m.path);
								}}
							/>
						))}
					</Collapse>
				))}
			</ScrollViewer>
		</Col>
	);
};

const ScrollViewer = styled.div`
	height: 100%;

	overflow: scroll;
	overflow-y: scroll;
	overflow-x: hidden;

	scrollbar-color: auto;
`;

export default OpenRecentColumn;
