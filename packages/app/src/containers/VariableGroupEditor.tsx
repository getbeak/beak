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
							<th>{'Item'}</th>
							<th>{'Production'}</th>
							<th>{'Local'}</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>{'env'}</td>
							<td>{'prod'}</td>
							<td>{'local'}</td>
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
`;

export default VariableGroupEditor;
