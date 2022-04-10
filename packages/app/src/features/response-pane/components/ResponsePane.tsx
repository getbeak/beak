import React from 'react';
import { useSelector } from 'react-redux';
import PendingSlash from '@beak/app/components/molecules/PendingSplash';
import { faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import Header from './molecules/Header';
import Inspector from './organisms/Inspector';

const ResponsePane: React.FunctionComponent = () => {
	const { id, tree } = useSelector(s => s.global.project);
	const selectedTab = useSelector(s => s.features.tabs.selectedTab);
	const flightHistories = useSelector(s => s.global.flight.flightHistory);
	const selectedNode = tree![selectedTab || 'non_existent'];

	if (!selectedTab) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	if (selectedTab && !selectedNode) {
		return (
			<Container>
				<span>{'id does not exist'}</span>
			</Container>
		);
	}

	const flightHistory = flightHistories[selectedTab];

	if (!flightHistory) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	const selectedFlight = flightHistory.history[flightHistory.selected!];

	if (!selectedFlight) {
		return (
			<Container>
				<span>{'selected flight id does not exist'}</span>
			</Container>
		);
	}

	return (
		<Container>
			<ShareButton onClick={async () => {
				const search = new URLSearchParams({ requestId: id! });
				const url = `https://share.getbeak.app/projects/${encodeURIComponent(selectedTab!)}?${search.toString()}`;

				await navigator.clipboard.writeText(url);
			}}>
				<FontAwesomeIcon
					icon={faShareNodes}
					fontSize={'12px'}
				/>
			</ShareButton>

			<Header selectedFlight={selectedFlight} />
			<Inspector flight={selectedFlight} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.surface};
	height: 100%;
	width: 100%;
`;

const ShareButton = styled.button`
	position: absolute;
	right: 10px;
	top: 10px;

	padding: 4px 5px;
	font-size: 12px;
	line-height: 11px;

	background: ${p => p.theme.ui.secondaryBackground};
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	border-radius: 4px;
	cursor: pointer;

	&:hover {
		background: ${p => p.theme.ui.background};
	}
`;

export default ResponsePane;
