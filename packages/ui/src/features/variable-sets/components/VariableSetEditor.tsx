import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { generateValueIdent } from '@beak/ui/lib/beak-variable-set/utils';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions } from '@beak/ui/store/variable-sets';
import { insertNewGroup, insertNewItem, removeGroup, removeItem } from '@beak/ui/store/variable-sets/actions';
import styled, { css } from 'styled-components';

import VariableInput from '../../variable-input/components/VariableInput';
import { BodyNameCell, BodyValueCell, HeaderGroupNameCell, HeaderNameCell } from './atoms/Cells';
import { Body, Header, Row } from './atoms/Structure';
import CellDeletionAction from './molecules/CellDeletionAction';
import CreateNewSplash from './molecules/CreateNewSplash';

interface VariableSetEditorProps {
	variableSetName: string;
}

const VariableSetEditor: React.FC<React.PropsWithChildren<VariableSetEditorProps>> = ({ variableSetName }) => {
	const dispatch = useDispatch();
	const variableSets = useAppSelector(s => s.global.variableSets);
	const variableSet = variableSets.variableSets[variableSetName];

	const [newItem, setNewItem] = useState<string | undefined>(void 0);
	const newItemRef = useRef<HTMLInputElement>(null);

	const [newGroup, setNewGroup] = useState<string | undefined>(void 0);
	const newGroupRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!newItem)
			return;

		if (!TypedObject.values(variableSet.items).includes(newItem))
			return;

		if (newItemRef?.current === null)
			return;

		newItemRef.current.focus();
		setNewItem(void 0);
	}, [newItem, setNewItem, variableSet?.items, newItemRef]);

	useEffect(() => {
		if (!newGroup)
			return;

		if (!TypedObject.values(variableSet.sets).includes(newGroup))
			return;

		if (newGroupRef?.current === null)
			return;

		newGroupRef.current.focus();
		setNewGroup(void 0);
	}, [newGroup, setNewGroup, variableSet?.sets, newGroupRef]);

	const setKeys = variableSet && TypedObject.keys(variableSet.sets);
	const itemKeys = variableSet && TypedObject.keys(variableSet.items);

	if (!variableSet)
		return null;

	return (
		<Container>
			{variableSet && setKeys.length === 0 && (
				<CreateNewSplash type={'set'} variableSet={variableSetName} />
			)}

			{variableSet && setKeys.length > 0 && (
				<React.Fragment>
					<Header>
						<Row $cols={setKeys.length}>
							<HeaderNameCell>
								<EmptyInput $center disabled value={'Name'} />
							</HeaderNameCell>
							{variableSet && setKeys.map(k => (
								<HeaderGroupNameCell key={k}>
									<StyledDebounce
										innerRef={variableSet.sets[k] === newGroup ? newGroupRef : null}
										$center
										type={'text'}
										value={variableSet.sets[k]}
										onChange={v => {
											dispatch(actions.updateGroupName({
												id: variableSetName,
												setId: k,
												updatedName: v,
											}));
										}}
									/>

									<CellDeletionAction
										name={variableSet.sets[k]}
										onConfirmedDeletion={() => dispatch(removeGroup({
											id: variableSetName,
											setId: k,
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
											id: variableSetName,
											setName: e.target.value,
										}));
									}}
								/>
							</HeaderGroupNameCell>
						</Row>
					</Header>

					<Body>
						{variableSet && itemKeys.map(ik => (
							<Row key={ik} $cols={setKeys.length}>
								<BodyNameCell>
									<StyledDebounce
										innerRef={variableSet.items[ik] === newItem ? newItemRef : null}
										type={'text'}
										value={variableSet.items[ik]}
										onChange={v => {
											dispatch(actions.updateItemName({
												id: variableSetName,
												itemId: ik,
												updatedName: v,
											}));
										}}
									/>

									<CellDeletionAction
										name={variableSet.items[ik]}
										onConfirmedDeletion={() => dispatch(removeItem({
											id: variableSetName,
											itemId: ik,
										}))}
									/>
								</BodyNameCell>

								{setKeys.map(gk => {
									const key = generateValueIdent(gk, ik);
									const value = variableSet.values[key];

									return (
										<BodyValueCell key={gk}>
											<VariableInput
												parts={value || ['']}
												onChange={parts => {
													dispatch(actions.updateValue({
														id: variableSetName,
														setId: gk,
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

						<Row $cols={setKeys.length}>
							<BodyNameCell>
								<EmptyInput
									placeholder={'New item...'}
									type={'text'}
									value={''}
									onChange={e => {
										setNewItem(e.target.value);
										dispatch(insertNewItem({
											id: variableSetName,
											itemName: e.target.value,
										}));
									}}
								/>
							</BodyNameCell>

							{variableSet && setKeys.map(k => (
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
`;

const StyledDebounce = styled(DebouncedInput)<{ $center?: boolean }>`${inputCss}`;
const EmptyInput = styled.input<{ $center?: boolean }>`${inputCss}`;

export default VariableSetEditor;
