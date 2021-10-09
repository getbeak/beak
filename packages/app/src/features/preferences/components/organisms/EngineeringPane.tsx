import Button from '@beak/app/components/atoms/Button';
import { ipcPreferencesService } from '@beak/app/lib/ipc';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import Pane from '../molecules/Pane';

const EngineeringPane: React.FunctionComponent = () => {
	const [environment, setEnvironment] = useState<string | undefined>(void 0);

	useEffect(() => {
		ipcPreferencesService.getEnvironment().then(setEnvironment);
	}, []);

	return (
		<Pane title={'Engineering'}>
			<ItemGroup>
				<ItemLabel>{'Environment:'}</ItemLabel>
				<select
					disabled={environment === void 0}
					value={environment}
					onChange={e => setEnvironment(e.target.value)}
				>
					<option value={'prod'}>{'Production'}</option>
					<option value={'nonprod'}>{'Non-production'}</option>
				</select>
			</ItemGroup>

			<ItemGroup>
				<ItemLabel>{'Actions:'}</ItemLabel>
				<Button>{'Reset config & cache'}</Button>
				<ItemSpacer />
				<Button colour={'destructive'}>{'Sign out'}</Button>
			</ItemGroup>
		</Pane>
	);
};

const ItemGroup = styled.div`
	margin-bottom: 15px;
`;

const ItemLabel = styled.div`
	font-size: 14px;
	color: ${p => p.theme.ui.textMinor};
	margin-bottom: 5px;
`;

const ItemSpacer = styled.div`
	height: 5px;
`;

export default EngineeringPane;
