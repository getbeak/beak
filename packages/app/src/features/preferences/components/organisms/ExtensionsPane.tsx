import Button from '@beak/app/components/atoms/Button';
import { ipcPreferencesService } from '@beak/app/lib/ipc';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import Pane from '../molecules/Pane';

const EngineeringPane: React.FunctionComponent = () => (
	<Pane title={'Extensions'}>
		<Title>
			{'Extensions are coming soon, check back later 👀'}
		</Title>
	</Pane>
);

const Title = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: ${p => p.theme.ui.textMinor};
`;

export default EngineeringPane;
