import { sentenceCase } from 'change-case';
import React, { useEffect, useState } from 'react';
import { Col } from 'react-grid-system';
import styled from 'styled-components';

import WelcomeColumnTitle from '../atoms/WelcomeColumnTitle';
import Collapse from '../molecules/Collapse';
import RecentEntry from '../molecules/RecentEntry';

type TimeCategory = 'today' | 'week' | 'month' | 'older';
type Recents = Record<TimeCategory, MockEntry[]>;

interface MockEntry {
	name: string;
	path: string;
	modifiedDate: string;
	type: 'local';
}

const categories: TimeCategory[] = ['today', 'week', 'month', 'older'];

const defaultRecents: Recents = {
	today: [],
	week: [],
	month: [],
	older: [],
};

const mockingData: MockEntry[] = [{
	name: 'Branch',
	path: 'C:/Users/afr/Beaks/Branch',
	modifiedDate: '2020-07-08T19:05:00Z',
	type: 'local',
}, {
	name: 'Xbl research',
	path: 'C:/Users/afr/Beaks/Xbox Research',
	modifiedDate: '2020-07-05T14:06:00Z',
	type: 'local',
}, {
	name: 'Monzo',
	path: 'C:/Users/afr/Beaks/Monzo',
	modifiedDate: '2020-06-30T11:55:00Z',
	type: 'local',
}, {
	name: 'Cuvva',
	path: 'C:/Users/afr/Beaks/Cuvva',
	modifiedDate: '2020-06-27T12:11:00Z',
	type: 'local',
}, {
	name: 'Tinder reversing',
	path: 'C:/Users/afr/Beaks/Tindr',
	modifiedDate: '2020-05-08T09:11:00Z',
	type: 'local',
}];

const OpenRecentColumn: React.FunctionComponent = () => {
	const [recents, setRecents] = useState<Recents>({ ...defaultRecents });

	useEffect(() => {
		const newRecents = { ...defaultRecents };
		const now = new Date().getTime() / 1000;

		mockingData.sort((a, b) => {
			const aD = new Date(a.modifiedDate).getTime();
			const bD = new Date(b.modifiedDate).getTime();

			return Math.sign(aD - bD);
		}).forEach(m => {
			const unix = new Date(m.modifiedDate).getTime() / 1000;
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
	}, []);

	return (
		<Col>
			<WelcomeColumnTitle>{'Open recent'}</WelcomeColumnTitle>

			<ScrollViewer>
				{categories.map(k => (
					<Collapse
						key={k}
						startOpen={true}
						title={sentenceCase(k)}
					>
						{recents[k].map(m => (
							<RecentEntry
								name={m.name}
								path={m.path}
								modifiedDate={m.modifiedDate}
								type={m.type}
								onClick={() => void 0}
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
