import React from 'react';

import { ItemGroup, ItemLabel } from '../atoms/item';
import Pane from '../molecules/Pane';

const GeneralPane: React.FunctionComponent = () => (
	<Pane title={'General'}>
		<ItemGroup>
			<ItemLabel>{'Theme:'}</ItemLabel>
			
		</ItemGroup>
	</Pane>
);

export default GeneralPane;
