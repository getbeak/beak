import React from 'react';
import Button from '@beak/app/components/atoms/Button';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';

import { Body, Header, Wrapper } from '../atoms';
import ErrorRenderer from './ErrorRenderer';

interface GenericErrorProps {
	filePath: string;
	error: Squawk;
}

const GenericError: React.FC<React.PropsWithChildren<GenericErrorProps>> = ({ filePath, error }) => (
	<Wrapper>
		<Header>{'Unable to load request file'}</Header>
		<Body>{'There was an unknown error while trying to load this request'}</Body>

		<Button onClick={() => ipcExplorerService.revealFile(filePath)}>
			{'Show request in finder'}
		</Button>

		<ErrorRenderer error={error} />
	</Wrapper>
);

export default GenericError;
