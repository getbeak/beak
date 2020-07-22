import React from 'react';
import styled from 'styled-components';

import { RequestNode } from '../../../../lib/project/types';

export interface UrlQueryPaneProps {
	node: RequestNode;
}

const UrlQueryPane: React.FunctionComponent<UrlQueryPaneProps> = props => (
	<React.Fragment>
		<EntryTable>
			<thead>
				<tr>
					<th></th>
					<th>{'Name'}</th>
					<th>{'Value'}</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><input type={'checkbox'} /></td>
					<td><input /></td>
					<td><input /></td>
				</tr>
			</tbody>
		</EntryTable>
	</React.Fragment>
);

const EntryTable = styled.table`
	width: 100%;

	thead > tr > th {
		text-align: left;

		color: ${props => props.theme.ui.textOnFill};
	}
`;


export default UrlQueryPane;
