import { TypedObject } from '@beak/common/dist/helpers/typescript';
import React from 'react';
import styled from 'styled-components';

const mock = {
	Environment: {
		selectedItem: 'Production',
		items: ['Production', 'Local'],
	},
	User: {
		selectedItem: 'AFR',
		items: ['AFR', 'George'],
	},
};

export interface VariableGroupsProps {
	collapsed: boolean;
}

const VariableGroups: React.FunctionComponent<VariableGroupsProps> = ({ collapsed }) => {
	return (
		<Container collapsed={collapsed}>
			{TypedObject.keys(mock).map(k => {
				const group = mock[k];

				return (
					<Item key={k}>
						<GroupName>
							{k}
						</GroupName>

						<Selector>
							<select value={group.selectedItem}>
								{group.items.map(i => <option key={i}>{i}</option>)}
							</select>
						</Selector>
					</Item>
				);
			})}
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

export default VariableGroups;
