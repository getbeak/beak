import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DebouncedInput from '@beak/app/components/atoms/DebouncedInput';
import { generateValueIdent } from '@beak/app/lib/beak-variable-group/utils';
import { actions } from '@beak/app/store/variable-groups';
import { insertNewGroup, insertNewItem, removeGroup, removeItem } from '@beak/app/store/variable-groups/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import styled, { css } from 'styled-components';

import VariableInput from '../../variable-input/components/VariableInput';
import { BodyNameCell, BodyValueCell, HeaderGroupNameCell, HeaderNameCell } from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import CellDeletionAction from './molecules/CellDeletionAction';
import CreateNewSplash from './molecules/CreateNewSplash';

interface VariableGroupEditorProps {
	variableGroupName: string;
}

const VariableGroupEditor: React.FunctionComponent<VariableGroupEditorProps> = ({ variableGroupName }) => {
	const dispatch = useDispatch();
	const variableGroups = useSelector(s => s.global.variableGroups);
	const variableGroup = variableGroups.variableGroups[variableGroupName];

	const [newItem, setNewItem] = useState<string | undefined>(void 0);
	const newItemRef = useRef<HTMLInputElement>(null);

	const [newGroup, setNewGroup] = useState<string | undefined>(void 0);
	const newGroupRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!newItem)
			return;

		if (!TypedObject.values(variableGroup.items).includes(newItem))
			return;

		if (newItemRef?.current === null)
			return;

		newItemRef.current.focus();
		setNewItem(void 0);
	}, [newItem, setNewItem, variableGroup?.items, newItemRef]);

	useEffect(() => {
		if (!newGroup)
			return;

		if (!TypedObject.values(variableGroup.groups).includes(newGroup))
			return;

		if (newGroupRef?.current === null)
			return;

		newGroupRef.current.focus();
		setNewGroup(void 0);
	}, [newGroup, setNewGroup, variableGroup?.groups, newGroupRef]);

	const groupKeys = variableGroup && TypedObject.keys(variableGroup.groups);
	const itemKeys = variableGroup && TypedObject.keys(variableGroup.items);

	if (!variableGroup)
		return <p>{'not found'}</p>;

	return (
		<Container>
			{variableGroup && groupKeys.length === 0 && (
				<CreateNewSplash type={'group'} variableGroup={variableGroupName} />
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
												variableGroup: variableGroupName,
												ident: k,
												updated: v,
											}));
										}}
									/>

									<CellDeletionAction
										name={variableGroup.groups[k]}
										onConfirmedDeletion={() => dispatch(removeGroup({
											id: k,
											variableGroup: variableGroupName,
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
										dispatch(insertNewGroup({
											variableGroup: variableGroupName,
											group: e.target.value,
										}));
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
												variableGroup: variableGroupName,
												ident: ik,
												updated: value,
											}));
										}}
									/>

									<CellDeletionAction
										name={variableGroup.items[ik]}
										onConfirmedDeletion={() => dispatch(removeItem({
											id: ik,
											variableGroup: variableGroupName,
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
														variableGroup: variableGroupName,
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
										dispatch(insertNewItem({
											variableGroup: variableGroupName,
											name: e.target.value,
										}));
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
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	overflow: overlay;

	background-color: ${props => props.theme.ui.surface};

	height: 100%;
	width: 100%;
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
