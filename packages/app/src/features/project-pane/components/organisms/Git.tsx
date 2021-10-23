import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

export interface GitProps {
	collapsed: boolean;
}

const Git: React.FunctionComponent<GitProps> = ({ collapsed }) => {
	const { branches, selectedBranch } = useSelector(s => s.global.git)!;

	if (branches.length === 0)
		return null;

	return (
		<Container collapsed={collapsed}>
			<Item>
				<GroupName>
					{'Branch'}
				</GroupName>

				<Selector>
					<select
						value={selectedBranch}
						onChange={() => { /* no-op */ }}
					>
						{branches.map(b => (
							<option disabled={selectedBranch !== b.name} key={b.name} value={b.name}>{b.name}</option>
						))}
					</select>
				</Selector>
			</Item>
		</Container>
	);
};

const Container = styled.div<{ collapsed: boolean }>`
	padding: 4px 14px;
	padding-right: 3px;

	overflow-y: scroll;
	max-height: 120px;

	${p => p.collapsed ? 'flex: 0; padding: 0;' : ''}
`;

const Item = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 2px 0;
`;

const GroupName = styled.span`
	min-width: 80px;
	color: ${p => p.theme.ui.textMinor};
	font-size: 12px;
`;

const Selector = styled.div`
	position: relative;
	margin-right: -3px;

	> select {
		font-size: 12px;
		border: 0;
		border-radius: 4px;
		background: none;
		color: ${p => p.theme.ui.textMinor};
		text-align-last: right;

		&:hover, &:active, &:focus {
			background: ${p => p.theme.ui.surface};
			outline: none;
		}
	}
`;

export default Git;
