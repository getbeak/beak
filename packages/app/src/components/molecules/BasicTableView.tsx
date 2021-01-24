import { TypedObject } from '@beak/common/helpers/typescript';
import { ToggleKeyValue, ValueParts } from '@beak/common/types/beak-project';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import VariableInput from '../../features/variable-input/components/molecules/VariableInput';

export interface MutableBasicTableViewProps {
	editable: true;
	disableToggle?: boolean;
	items: Record<string, ToggleKeyValue>;
	addItem: () => void;
	updateItem: (type: keyof ToggleKeyValue, ident: string, value: string | boolean | ValueParts) => void;
	removeItem: (ident: string) => void;
}

export interface ImmutableBasicTableViewProps {
	editable: false;
	disableToggle?: boolean;
	items: Record<string, ToggleKeyValue>;
}

const BasicTableView: React.FunctionComponent<MutableBasicTableViewProps | ImmutableBasicTableViewProps> = props => {
	const { items } = props;
	const updateItem = (props as MutableBasicTableViewProps).updateItem || updateItemSnub;

	return (
		<React.Fragment>
			<EntryTable>
				<thead>
					<tr>
						{props.editable && <Header></Header>}
						<Header>{'Name'}</Header>
						<Header>{'Value'}</Header>
						{props.editable && <Header></Header>}
					</tr>
				</thead>
				<tbody>
					{TypedObject.keys(items).map(k => {
						const entry = items[k];

						return (
							<Row key={k}>
								{!props.disableToggle && props.editable && (
									<ToggleCell>
										<input
											type={'checkbox'}
											checked={entry.enabled}
											onChange={e => updateItem('enabled', k, e.target.checked)}
										/>
									</ToggleCell>
								)}
								<td>
									<InputText
										disabled={!props.editable}
										value={entry.name}
										type={'text'}
										onChange={e => updateItem('name', k, e.target.value)}
									/>
								</td>
								<VariableInputCell>
									<VariableInput
										disabled={!props.editable}
										parts={entry.value}
										onChange={e => updateItem('value', k, e)}
									/>
								</VariableInputCell>
								{props.editable && (
									<ToggleCell>
										<RemoveButton onClick={() => {
											props.removeItem(k);
										}}>
											<FontAwesomeIcon
												size={'sm'}
												icon={faTrashAlt}
											/>
										</RemoveButton>
									</ToggleCell>
								)}
							</Row>
						);
					})}
				</tbody>
			</EntryTable>

			{props.editable && (
				<AddButtonWrapper>
					<Button onClick={() => {
						props.addItem();
					}}>
						{'Add'}
					</Button>
				</AddButtonWrapper>
			)}
		</React.Fragment>
	);
};

function updateItemSnub(_type: keyof ToggleKeyValue, _ident: string, _value: string | boolean | ValueParts) {
	return;
}

const EntryTable = styled.table`
	margin-top: 5px;
	width: 100%;
	border-collapse: collapse;
`;

const Header = styled.th`
	text-align: left;
	font-size: 13px;
	font-weight: 400;
	padding-left: 6px;

	color: ${props => props.theme.ui.textOnFill};
`;

const Row = styled.tr`
	border-bottom: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
`;

const ToggleCell = styled.td`
	width: 20px;
`;

const InputText = styled.input`
	width: calc(100% - 10px);
	border: none;
	background: transparent;
	padding: 2px 5px;
	margin: 0; margin-bottom: -2px;
	border: 1px solid transparent;

	color: ${props => props.theme.ui.textOnFill};
	font-size: 12px;

	&:focus {
		box-shadow: none !important;
	}
`;

const VariableInputCell = styled.td`
	> article {
		width: calc(100% - 10px);
		border: none;
		background: transparent;
		padding: 2px 5px;
		margin: 0; margin-bottom: -2px;
		border: 1px solid transparent;

		color: ${props => props.theme.ui.textOnFill};
		font-size: 12px;

		&:focus {
			box-shadow: none !important;
		}
	}
`;

const Button = styled.button`
	background: transparent;
	border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	border-radius: 10px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};

	padding: 3px 8px;
	font-size: 11px;

	&:hover, &:focus {
		outline: none;
		border-color: ${props => props.theme.ui.primaryFill};
	}
	&:active {
		background-color: ${props => props.theme.ui.primaryFill};
	}
`;

const RemoveButton = styled(Button)`
	padding: 3px 6px;
	margin-left: 5px;
`;

const AddButtonWrapper = styled.div`
	display: flex;
	justify-content: flex-end;

	margin-top: 10px;
	margin-right: 2px;
`;

export default BasicTableView;
