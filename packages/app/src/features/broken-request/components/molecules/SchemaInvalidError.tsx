import React from 'react';
import Button from '@beak/app/components/atoms/Button';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';

import { Body, Header, Wrapper } from '../atoms';
import ErrorRenderer from './ErrorRenderer';

interface SchemaInvalidErrorProps {
	filePath: string;
	error: Squawk;
}

const SchemaInvalidError: React.FC<SchemaInvalidErrorProps> = ({ filePath, error }) => (
	<Wrapper>
		<Header>{'Request file validation has failed'}</Header>
		<Body>{'The file for this request is corrupt. The error below should help you resolve the issue'}</Body>

		<Button onClick={() => ipcExplorerService.revealFile(filePath)}>
			{'Show request in finder'}
		</Button>

		<ErrorRenderer error={error} />
	</Wrapper>
);

export default SchemaInvalidError;
