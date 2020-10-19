import { ToggleKeyValue } from '@beak/common/src/beak-project/types';
import { TypedObject } from '@beak/common/src/helpers/typescript';
import React from 'react';
import styled from 'styled-components';

export interface MutableBasicTableViewProps {
	editable: true;
	items: Record<string, ToggleKeyValue>;
	addItem: () => void;
	updateItem: (type: keyof ToggleKeyValue, ident: string, value: string | boolean) => void;
	removeItem: (ident: string) => void;
}

export interface ImmutableBasicTableViewProps {
	editable: false;
}

// export interface BasicTableViewProps extends EditableBasicTableViewProps, ImmutableBasicTableViewProps { }

const BasicTableView: React.FunctionComponent<MutableBasicTableViewProps> = props => (
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
				{TypedObject.keys(props.items).map(k => {
					const entry = props.items[k];

					return (
						<Row key={k}>
							{props.editable && (
								<ToggleCell>
									<InputToggle
										type={'checkbox'}
										checked={entry.enabled}
										onChange={e => props.updateItem('enabled', k, e.target.checked)}
									/>
								</ToggleCell>
							)}
							<td>
								<InputText
									disabled={!props.editable}
									value={entry.name}
									onChange={e => props.updateItem('name', k, e.target.value)}
								/>
							</td>
							<td>
								<InputText
									disabled={!props.editable}
									value={entry.value}
									onChange={e => props.updateItem('value', k, e.target.value)}
								/>
							</td>
							{props.editable && (
								<ToggleCell>
									<Button onClick={() => {
										props.removeItem(k);
									}}>
										{'Remove'}
									</Button>
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

const EntryTable = styled.table`
	width: 100%;
	border-collapse: collapse;
`;

const Header = styled.th`
	text-align: left;
	font-size: 13px;
	font-weight: 400;

	color: ${props => props.theme.ui.textOnFill};
`;

const Row = styled.tr`
	border-bottom: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
`;

const ToggleCell = styled.td`
	width: 20px;
`;

const InputToggle = styled.input`

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
		outline: none;
		border: 1px solid ${props => props.theme.ui.primaryFill};
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

const AddButtonWrapper = styled.div`
	display: flex;
	justify-content: flex-end;

	margin-top: 10px;
	margin-right: 2px;
`;

export default BasicTableView;
