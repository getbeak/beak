import TabBar from '@beak/app/components/atoms/TabBar';
import TabItem from '@beak/app/components/atoms/TabItem';
import TabSpacer from '@beak/app/components/atoms/TabSpacer';
import { actions } from '@beak/app/store/variable-groups';
import { insertNewItem } from '@beak/app/store/variable-groups/actions';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

const VariableGroupEditor: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const variableGroups = useSelector(s => s.global.variableGroups);
	const vg = variableGroups.variableGroups;
	const tabs = TypedObject.keys(vg);
	const [tab, setTab] = useState(tabs[0]);
	const variableGroup = vg[tab];

	const [newItem, setNewItem] = useState<string | undefined>(void 0);
	const newItemRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!tabs.includes(tab))
			setTab(tabs[0]);
	}, [tabs, tab, setTab]);

	useEffect(() => {
		if (!newItem)
			return;

		if (!TypedObject.values(vg[tab].items).includes(newItem))
			return;

		if (newItemRef?.current === null)
			return;

		newItemRef.current.focus();
		setNewItem(void 0);
	}, [newItem, setNewItem, vg[tab]?.items, newItemRef]);

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				{tabs.map(t => (
					<TabItem
						active={tab === t}
						key={t}
						onClick={() => setTab(t)}
					>
						{t}
					</TabItem>
				))}
				<TabSpacer />
			</TabBar>

			<TabBody>
				<Table>
					<thead>
						<tr>
							<th><Editable disabled value={'Variable name'} /></th>
							{variableGroup && TypedObject.keys(variableGroup.groups).map(k => (
								<th key={k}>
									<Editable
										type={'text'}
										value={variableGroup.groups[k]}
										onChange={e => {
											dispatch(actions.updateGroupName({
												variableGroup: tab,
												ident: k,
												updated: e.target.value,
											}));
										}}
									/>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{variableGroup && TypedObject.keys(variableGroup.items).map(ik => (
							<tr key={ik}>
								<td>
									<Editable
										ref={variableGroup.items[ik] === newItem ? newItemRef : null}
										type={'text'}
										value={variableGroup.items[ik]}
										onChange={e => {
											dispatch(actions.updateItemName({
												variableGroup: tab,
												ident: ik,
												updated: e.target.value,
											}));
										}}
									/>
								</td>

								{TypedObject.keys(variableGroup.groups).map(gk => {
									const valueKey = TypedObject.keys(variableGroup.values).find(k => {
										const value = variableGroup.values[k];

										if (value.groupId === gk && value.itemId === ik)
											return true;

										return false;
									});

									const value = variableGroup.values[valueKey || ''];

									return (
										<td key={gk}>
											<Editable
												type={'text'}
												value={value?.value || ''}
												onChange={e => {
													dispatch(actions.updateValue({
														variableGroup: tab,
														ident: valueKey,
														groupId: gk,
														itemId: ik,
														updated: e.target.value,
													}));
												}}
											/>
										</td>
									);
								})}
							</tr>
						))}
						<tr>
							<td>
								<Editable
									placeholder={'New variable...'}
									type={'text'}
									value={''}
									onChange={e => {
										setNewItem(e.target.value);
										dispatch(insertNewItem({
											variableGroup: tab,
											name: e.target.value,
										}));
									}}
								/>
							</td>
							{variableGroup && TypedObject.keys(variableGroup.groups).map(k => (
								<td key={k}><Editable disabled /></td>
							))}
						</tr>
					</tbody>
				</Table>
			</TabBody>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;

	background-color: ${props => props.theme.ui.surface};

	height: 100%;
	width: 100%;
`;

const TabBody = styled.div`
	flex-grow: 2;

	overflow-y: auto;
	height: 100%;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;

	tr {
		border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	}

	tbody > tr {
		&:last-of-type {
			border-right: none;
		}
	}

	th, td {
		border-right: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};

		&:last-of-type {
			border-right: none;
		}
	}

	tr > th > input {
		padding: 4px 2px;
	}
`;

const Editable = styled.input`
	margin-bottom: -1px;
	width: calc(100% - 3px);
	background: none;
	border: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	font-size: 13px;
	font-weight: normal;
	text-align: inherit;
	padding: 3px 2px;

	&:disabled { user-select: none; }
`;

export default VariableGroupEditor;
