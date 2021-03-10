import TabBar from '@beak/app/components/atoms/TabBar';
import TabItem from '@beak/app/components/atoms/TabItem';
import TabSpacer from '@beak/app/components/atoms/TabSpacer';
import { actions } from '@beak/app/store/variable-groups';
import { insertNewItem } from '@beak/app/store/variable-groups/actions';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import VariableInput from '../../variable-input/components/molecules/VariableInput';
import { BodyNameCell, BodyValueCell, HeaderGroupCell, HeaderNameCell } from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';

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
				<Header>
					<Row cols={TypedObject.keys(variableGroup.groups).length + 1}>
						<HeaderNameCell>
							<Editable disabled value={'Name'} />
						</HeaderNameCell>
						{variableGroup && TypedObject.keys(variableGroup.groups).map(k => (
							<HeaderGroupCell key={k}>
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
							</HeaderGroupCell>
						))}
					</Row>
				</Header>

				<Body>
					{variableGroup && TypedObject.keys(variableGroup.items).map(ik => (
						<Row key={ik} cols={TypedObject.keys(variableGroup.groups).length + 1}>
							<BodyNameCell>
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
							</BodyNameCell>

							{TypedObject.keys(variableGroup.groups).map(gk => {
								const valueKey = TypedObject.keys(variableGroup.values).find(k => {
									const value = variableGroup.values[k];

									if (value.groupId === gk && value.itemId === ik)
										return true;

									return false;
								});

								const value = variableGroup.values[valueKey || ''];

								return (
									<BodyValueCell key={gk}>
										<VariableInput
											parts={value?.value || ['']}
											onChange={parts => {
												dispatch(actions.updateValue({
													variableGroup: tab,
													ident: valueKey,
													groupId: gk,
													itemId: ik,
													updated: parts,
												}));
											}}
										/>
									</BodyValueCell>
								);
							})}
						</Row>
					))}

					<Row cols={TypedObject.keys(variableGroup.groups).length + 1}>
						<BodyNameCell>
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
						</BodyNameCell>
						{variableGroup && TypedObject.keys(variableGroup.groups).map(k => (
							<BodyValueCell key={k}>
								<Editable disabled />
							</BodyValueCell>
						))}
					</Row>
				</Body>
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

const Editable = styled.input`
	width: calc(100% - 12px);
	background: none;
	border: 1px solid transparent;
	color: ${props => props.theme.ui.textMinor};
	font-size: 13px;
	font-weight: normal;
	text-align: inherit;
	padding: 3px 5px;

	&:disabled { user-select: none; }
	&:focus {
		/* forgive me for the importants */
		box-shadow: none !important;
		border: 1px solid ${p => p.theme.ui.primaryFill} !important;
	}
`;

export default VariableGroupEditor;
