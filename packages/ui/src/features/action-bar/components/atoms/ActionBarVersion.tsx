import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import { Box } from '@chakra-ui/react';
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
	<Box
		display='inline-flex'
		alignItems='center'
		px='1.5'
		h='18px'
		fontSize='9px'
		fontWeight='700'
		letterSpacing='0.08em'
		textTransform='uppercase'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)'
		bg='color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)'
		color='accent.pink'
		boxShadow='inset 0 1px 0 color-mix(in srgb, white 12%, transparent)'
	>
		{label}
	</Box>
);

export default ActionBarVersion;
