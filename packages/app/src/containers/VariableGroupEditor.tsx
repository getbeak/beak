import React from 'react';
import styled from 'styled-components';

import TabBar from '../components/atoms/TabBar';
import TabItem from '../components/atoms/TabItem';
import TabSpacer from '../components/atoms/TabSpacer';

const VariableGroupEditor: React.FunctionComponent = () => {
	const params = new URLSearchParams(window.location.search);
	const projectPath = decodeURIComponent(params.get('projectPath') as string);

	return (
		<Container>
			<TabBar centered>
				<TabSpacer />
				<TabItem active>
					{'Environment'}
				</TabItem>
				<TabItem>
					{'Person'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			<TabBody>
				<Table>
					<thead>
						<tr>
							<th><Editable value={'Variable'} /></th>
							<th><Editable value={'Production'} /></th>
							<th><Editable value={'Local'} /></th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<Editable value={'env'} /></td>
							<td>
								<Editable value={'prod'} /></td>
							<td>
								<Editable value={'local'} /></td>
						</tr>
						<tr>
							<td><Editable placeholder={'New variable...'} /></td>
							<td><Editable /></td>
							<td><Editable /></td>
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
	height: 100%;
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

	tr > th {
		padding: 2px 4px;
	}
`;

const Editable = styled.input`
	width: calc(100% - 4px);
	background: none;
	border: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	font-size: 13px;
	font-weight: normal;
	text-align: inherit;

	&:focus, &:active {
		outline: 1px solid ${p => p.theme.ui.primaryFill};
	}
`;

export default VariableGroupEditor;
