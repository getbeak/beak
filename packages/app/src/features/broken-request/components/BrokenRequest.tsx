import Squawk from '@beak/common/utils/squawk';
import React from 'react';

import GenericError from './molecules/GenericError';
import SchemaInvalidError from './molecules/SchemaInvalidError';

interface BrokenRequestProps {
	filePath: string;
	error: Squawk;
}

const BrokenRequest: React.FunctionComponent<BrokenRequestProps> = ({ filePath, error }) => {
	switch (error.code) {
		case 'schema_invalid': return <SchemaInvalidError filePath={filePath} error={error} />;
		default: return <GenericError filePath={filePath} error={error} />;
	}
};

export default BrokenRequest;