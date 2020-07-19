import React from 'react';

import Button from '../../../../components/atoms/Button';
import { WelcomeViewType } from '../../../../containers/Welcome';
import ViewIntroLine from '../atoms/ViewIntroLine';
import ViewTitle from '../atoms/ViewTitle';

export interface CreateViewProps {
	setView: (view: WelcomeViewType) => void;
}

const CreateView: React.FunctionComponent<CreateViewProps> = ({ setView }) => (
	<React.Fragment>
		<ViewTitle>{'Let\'s get going'}</ViewTitle>
		<ViewIntroLine>{'You should be good to go in just a mo...'}</ViewIntroLine>

		<div>
			<p>{'Project name:'}</p>
			<p>{'Project path [btn]:'}</p>
			<p>{'Options?:'}</p>

			<Button colour={'secondary'} onClick={() => setView('main') }>{'Cancel'}</Button>
			<Button>{'Create'}</Button>
		</div>
	</React.Fragment>
);

export default CreateView;
