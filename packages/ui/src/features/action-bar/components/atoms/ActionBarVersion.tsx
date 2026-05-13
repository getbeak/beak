import { Badge } from '@chakra-ui/react';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import React, { useContext } from 'react';
import semverParse from 'semver/functions/parse';

const ActionBarVersion: React.FC = () => {
	const context = useContext(WindowSessionContext);
	const parsed = semverParse(context.version);

	if (!parsed) return null;

	// Hack for local version being that of electron (we'll never be higher).
	if (parsed.major > 10) return <VersionBadge label='local' />;

	if (parsed.prerelease.length === 0) return null;

	return <VersionBadge label={String(parsed.prerelease[0])} />;
};

const VersionBadge: React.FC<{ label: string }> = ({ label }) => (
	<Badge
		px='1.5'
		py='0.5'
		fontSize='xs'
		fontWeight='medium'
		borderRadius='md'
		borderWidth='2px'
		borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 90%, transparent)'
		bg='color-mix(in srgb, var(--beak-colors-accent-pink) 70%, transparent)'
		color='fg.onAccent'
	>
		{label}
	</Badge>
);

export default ActionBarVersion;
