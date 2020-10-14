import React from 'react';
import styled from 'styled-components';

import Button from '../../../../components/atoms/Button';
import { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';

const electron = window.require('electron');
const { ipcRenderer } = electron;

export interface CreateViewProps {
	setView: (view: WelcomeViewType) => void;
}

const CreateView: React.FunctionComponent<CreateViewProps> = ({ setView }) => (
	<Wrapper>
		<ViewTitle>{'Let\'s get going 🌶'}</ViewTitle>
		<ViewIntroLine>{'You should be good to go in just a sec...'}</ViewIntroLine>

		{'<< project name >>'}<br />
		{'<< project options (?) >>'}

		<ActionsWrapper>
			<Button
				onClick={() => {
					ipcRenderer.send('project:create', 'Example');
				}}
			>
				{'Create'}
			</Button>
			<ActionSpacer />
			<Button
				colour={'secondary'}
				onClick={() => setView('main')}
			>
				{'Cancel'}
			</Button>
		</ActionsWrapper>
	</Wrapper>
);

const Wrapper = styled.div`
	position: relative;
	top: 0; bottom: 0; left: 0; right: 0;
	width: calc(100vw - 60px);
	height: calc(100vh - 80px);
`;

const ActionsWrapper = styled.div`
	position: absolute;
	bottom: 0;
	right: 0;
`;

const ActionSpacer = styled.div`
	display: inline-block;
	width: 15px;
`;

export default CreateView;
