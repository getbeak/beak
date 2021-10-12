import React from 'react';

import { SelectContainer, SelectItem, SelectItemPreview } from '../atoms/fancy-select';
import { ItemGroup, ItemInfo, ItemLabel } from '../atoms/item';
import Pane from '../molecules/Pane';

const GeneralPane: React.FunctionComponent = () => (
	<Pane title={'General'}>
		<ItemGroup>
			<ItemLabel>{'Theme:'}</ItemLabel>
			<SelectContainer>
				<SelectItem>
					<SelectItemPreview />
					{'System'}
				</SelectItem>
				<SelectItem>
					<SelectItemPreview />
					{'Light'}
				</SelectItem>
				<SelectItem $active>
					<SelectItemPreview $active />
					{'Dark'}
				</SelectItem>
			</SelectContainer>
			<ItemInfo>{'Theme switching is coming soon'}</ItemInfo>
		</ItemGroup>
	</Pane>
);

export default GeneralPane;
