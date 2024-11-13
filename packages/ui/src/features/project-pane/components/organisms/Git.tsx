import React from 'react';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { useAppSelector } from '@beak/ui/store/redux';
import styled from 'styled-components';

import NoProjectInformation from '../molecules/NoProjectInformation';

const Git: React.FC<React.PropsWithChildren<unknown>> = () => {
	const { branches, selectedBranch } = useAppSelector(s => s.global.git)!;

	useSectionBody({
		maxHeight: '120px',
		flexShrink: 0,
	});

	if (branches.length === 0) {
		return (
			<Container>
				<NoProjectInformation />
			</Container>
		);
	}

	return (
		<Container>
			<Item>
				<GroupName>
					{'Branch'}
				</GroupName>

				<Selector disabled value={selectedBranch}>
					{branches.map(b => (
						<option disabled={selectedBranch !== b.name} key={b.name} value={b.name}>{b.name}</option>
					))}
				</Selector>
			</Item>
		</Container>
	);
};

const Container = styled.div`
	padding: 4px 5px;
	padding-right: 0;
	padding-bottom: 0;
`;

const Item = styled.div`
	display: grid;
	grid-template-columns: minmax(10px, max-content) minmax(10px, max-content);
	justify-content: space-between;
	align-items: center;
	gap: 5px;
	margin: 4px 0;
	max-width: calc(100% - 3px);

	&:first-child {
		margin-top: 0;
	}

	&:not(:last-child) {
		margin-bottom: 6px;
	}
`;

const GroupName = styled.span`
	color: ${p => p.theme.ui.textMinor};
	font-size: 12px;

	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const Selector = styled.select`
	width: 100%;
	font-size: 12px;
	border: 0;
	border-radius: 4px;
	background: none;
	color: ${p => p.theme.ui.textMinor};
	text-align-last: right;
	text-overflow: ellipsis;

	&:disabled {
		cursor: not-allowed;
	}

	&:not(:disabled):hover, &:not(:disabled):active, &:not(:disabled):focus {
		background: ${p => p.theme.ui.surface};
		outline: none;
	}
`;

export default Git;
