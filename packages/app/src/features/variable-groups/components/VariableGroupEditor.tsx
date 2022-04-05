import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DebouncedInput from '@beak/app/components/atoms/DebouncedInput';
import TabBar from '@beak/app/components/atoms/TabBar';
import TabItem from '@beak/app/components/atoms/TabItem';
import TabSpacer from '@beak/app/components/atoms/TabSpacer';
import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
import { ipcDialogService } from '@beak/app/lib/ipc';
import { actions } from '@beak/app/store/variable-groups';
import { insertNewGroup, insertNewItem, removeGroup, removeItem, removeVg } from '@beak/app/store/variable-groups/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { css } from 'styled-components';

import VariableInput from '../../variable-input/components/VariableInput';
import { BodyNameCell, BodyValueCell, HeaderGroupNameCell, HeaderNameCell } from './atoms/Cells';
import { Body, Header, HeaderAction, Row } from './atoms/Structure';
import CellDeletionAction from './molecules/CellDeletionAction';
import CreateNewSplash from './molecules/CreateNewSplash';

const VariableGroupEditor: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const variableGroups = useSelector(s => s.global.variableGroups);
	const vg = variableGroups.variableGroups;
	const tabs = TypedObject.keys(vg);
	const [tab, setTab] = useState(tabs[0]);
	const variableGroup = vg[tab];

	const [newItem, setNewItem] = useState<string | undefined>(void 0);
	const newItemRef = useRef<HTMLInputElement>(null);

	const [newGroup, setNewGroup] = useState<string | undefined>(void 0);
	const newGroupRef = useRef<HTMLInputElement>(null);

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

	useEffect(() => {
		if (!newGroup)
			return;

		if (!TypedObject.values(vg[tab].groups).includes(newGroup))
			return;

		if (newGroupRef?.current === null)
			return;

		newGroupRef.current.focus();
		setNewGroup(void 0);
	}, [newGroup, setNewGroup, vg[tab]?.groups, newGroupRef]);

	if (tabs.length === 0) {
		return (
			<Container>
				<CreateNewSplash type={'variable-group'} />
			</Container>
		);
	}

	const groupKeys = variableGroup && TypedObject.keys(variableGroup.groups);
	const itemKeys = variableGroup && TypedObject.keys(variableGroup.items);

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

						<HeaderAction>
							<FontAwesomeIcon
								icon={faTrashAlt}
								color={'white'}
								fontSize={'10px'}
								onClick={async () => {
									const result = await ipcDialogService.showMessageBox({
										title: 'Are you sure?',
										message: `Are you sure you want to remove ${t}?`,
										detail: 'This action cannot be undone from inside Beak',
										type: 'warning',
										buttons: ['Remove', 'Cancel'],
										defaultId: 1,
										cancelId: 1,
									});

									if (result.response === 1)
										return;

									dispatch(removeVg(t));
								}}
							/>
						</HeaderAction>
					</TabItem>
				))}
				<TabSpacer />
			</TabBar>

			<TabBody>
				{variableGroup && groupKeys.length === 0 && (
					<CreateNewSplash type={'group'} variableGroup={tab} />
				)}

				{variableGroup && groupKeys.length > 0 && (
					<React.Fragment>
						<Header>
							<Row $cols={groupKeys.length}>
								<HeaderNameCell>
									<EmptyInput $center disabled value={'Name'} />
								</HeaderNameCell>
								{variableGroup && groupKeys.map(k => (
									<HeaderGroupNameCell key={k}>
										<StyledDebounce
											innerRef={variableGroup.groups[k] === newGroup ? newGroupRef : null}
											$center
											type={'text'}
											value={variableGroup.groups[k]}
											onChange={v => {
												dispatch(actions.updateGroupName({
													variableGroup: tab,
													ident: k,
													updated: v,
												}));
											}}
										/>

										<CellDeletionAction
											name={variableGroup.groups[k]}
											onConfirmedDeletion={() => dispatch(removeGroup({
												id: k,
												variableGroup: tab,
											}))}
										/>
									</HeaderGroupNameCell>
								))}
								<HeaderGroupNameCell>
									<EmptyInput
										placeholder={'New group...'}
										type={'text'}
										value={''}
										onChange={e => {
											setNewGroup(e.target.value);
											dispatch(insertNewGroup({ variableGroup: tab, group: e.target.value }));
										}}
									/>
								</HeaderGroupNameCell>
							</Row>
						</Header>

						<Body>
							{variableGroup && itemKeys.map(ik => (
								<Row key={ik} $cols={groupKeys.length}>
									<BodyNameCell>
										<StyledDebounce
											innerRef={variableGroup.items[ik] === newItem ? newItemRef : null}
											type={'text'}
											value={variableGroup.items[ik]}
											onChange={value => {
												dispatch(actions.updateItemName({
													variableGroup: tab,
													ident: ik,
													updated: value,
												}));
											}}
										/>

										<CellDeletionAction
											name={variableGroup.items[ik]}
											onConfirmedDeletion={() => dispatch(removeItem({
												id: ik,
												variableGroup: tab,
											}))}
										/>
									</BodyNameCell>

									{groupKeys.map(gk => {
										const key = generateValueIdent(gk, ik);
										const value = variableGroup.values[key];

										return (
											<BodyValueCell key={gk}>
												<VariableInput
													parts={value || ['']}
													onChange={parts => {
														dispatch(actions.updateValue({
															variableGroup: tab,
															groupId: gk,
															itemId: ik,
															updated: parts,
														}));
													}}
												/>
											</BodyValueCell>
										);
									})}

									<BodyValueCell>
										<EmptyInput disabled />
									</BodyValueCell>
								</Row>
							))}

							<Row $cols={groupKeys.length}>
								<BodyNameCell>
									<EmptyInput
										placeholder={'New item...'}
										type={'text'}
										value={''}
										onChange={e => {
											setNewItem(e.target.value);
											dispatch(insertNewItem({ variableGroup: tab, name: e.target.value }));
										}}
									/>
								</BodyNameCell>

								{variableGroup && groupKeys.map(k => (
									<BodyValueCell key={k}>
										<EmptyInput disabled />
									</BodyValueCell>
								))}

								<BodyValueCell>
									<EmptyInput disabled />
								</BodyValueCell>
							</Row>
						</Body>
					</React.Fragment>
				)}
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
	position: relative;
	flex-grow: 2;

	overflow-y: overlay;
	height: 100%;
`;

const inputCss = css<{ $center?: boolean }>`
	width: calc(100% - 12px);
	background: none;
	border: 1px solid transparent;
	color: ${props => props.theme.ui.textMinor};
	font-size: 13px;
	font-weight: normal;
	text-align: ${p => p.$center ? 'center' : 'inherit'};
	padding: 3px 5px;

	&:disabled { user-select: none; }
	&:focus {
	}
`;

const StyledDebounce = styled(DebouncedInput)<{ $center?: boolean }>`${inputCss}`;
const EmptyInput = styled.input<{ $center?: boolean }>`${inputCss}`;

export default VariableGroupEditor;
