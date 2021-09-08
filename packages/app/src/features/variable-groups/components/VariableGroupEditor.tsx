import DebouncedInput from '@beak/app/components/atoms/DebouncedInput';
import TabBar from '@beak/app/components/atoms/TabBar';
import TabItem from '@beak/app/components/atoms/TabItem';
import TabSpacer from '@beak/app/components/atoms/TabSpacer';
import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
import { actions } from '@beak/app/store/variable-groups';
import { insertNewItem } from '@beak/app/store/variable-groups/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';

import VariableInput from '../../variable-input/components/molecules/VariableInput';
import { BodyNameCell, BodyValueCell, HeaderGroupNameCell, HeaderNameCell } from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import CreateNewSplash from './molecules/CreateNewSplash';
import OptionsMenu from './molecules/OptionsMenu';

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

						<OptionsMenu
							type={'variable-group'}
							inTab
							variableGroup={t}
						/>
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
							<Row cols={groupKeys.length}>
								<HeaderNameCell>
									<EmptyInput center disabled value={'Name'} />
								</HeaderNameCell>
								{variableGroup && groupKeys.map(k => (
									<HeaderGroupNameCell key={k}>
										<StyledDebounce
											center
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

										<OptionsMenu
											type={'group'}
											id={k}
											variableGroup={tab}
										/>
									</HeaderGroupNameCell>
								))}
							</Row>
						</Header>

						<Body>
							{variableGroup && itemKeys.map(ik => (
								<Row key={ik} cols={groupKeys.length}>
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

										<OptionsMenu
											type={'item'}
											id={ik}
											variableGroup={tab}
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
								</Row>
							))}

							<Row cols={groupKeys.length}>
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
	flex-grow: 2;

	overflow-y: auto;
	height: 100%;
`;

const inputCss = css<{ center?: boolean }>`
	width: calc(100% - 12px);
	background: none;
	border: 1px solid transparent;
	color: ${props => props.theme.ui.textMinor};
	font-size: 13px;
	font-weight: normal;
	text-align: ${p => p.center ? 'center' : 'inherit'};
	padding: 3px 5px;

	&:disabled { user-select: none; }
	&:focus {
		/* forgive me for the importants */
		box-shadow: none !important;
		border: 1px solid ${p => p.theme.ui.primaryFill} !important;
	}
`;

const StyledDebounce = styled(DebouncedInput)<{ center?: boolean }>`${inputCss}`;
const EmptyInput = styled.input<{ center?: boolean }>`${inputCss}`;

export default VariableGroupEditor;
