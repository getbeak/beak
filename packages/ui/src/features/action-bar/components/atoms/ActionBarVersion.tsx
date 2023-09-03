import React, { useContext } from 'react';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import { toHexAlpha } from '@beak/design-system/utils';
import semverParse from 'semver/functions/parse';
import styled from 'styled-components';

const ActionBarVersion: React.FC<React.PropsWithChildren<unknown>> = () => {
	const context = useContext(WindowSessionContext);
	const parsed = semverParse(context.version);

	if (!parsed)
		return null;

	// Hack for local version being that of electron (We'll never be higher...)
	if (parsed.major > 10)
		return <Label>{'local'}</Label>;

	if (parsed.prerelease.length === 0)
		return null;

	return <Label>{parsed.prerelease[0]}</Label>;
};

const Label = styled.div`
	border: 2px solid ${p => toHexAlpha(p.theme.ui.primaryFill, 0.9)};
	border-radius: 6px;
	padding: 2px 4px;
	font-size: 12px;
	color: ${p => p.theme.ui.textOnAction};

	background: ${p => toHexAlpha(p.theme.ui.primaryFill, 0.7)};
`;

export default ActionBarVersion;
