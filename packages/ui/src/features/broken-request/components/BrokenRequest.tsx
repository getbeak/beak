import React from 'react';
import Squawk from '@beak/common/utils/squawk';

import GenericError from './molecules/GenericError';
import SchemaInvalidError from './molecules/SchemaInvalidError';

interface BrokenRequestProps {
	filePath: string;
	error: Squawk;
}

const BrokenRequest: React.FC<React.PropsWithChildren<BrokenRequestProps>> = ({ filePath, error }) => {
	switch (error.code) {
		case 'schema_invalid': return <SchemaInvalidError filePath={filePath} error={error} />;
		default: return <GenericError filePath={filePath} error={error} />;
	}
};

export default BrokenRequest;
