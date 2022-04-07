import React, { useContext } from 'react';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { toHexAlpha } from '@beak/design-system/utils';
import { parseSemver } from '@sentry/react/node_modules/@sentry/utils';
import styled from 'styled-components';

const ActionBarVersion: React.FunctionComponent = () => {
	const context = useContext(WindowSessionContext);
	const parsed = parseSemver(context.version);

	if (parsed.major ?? 0 > 10)
		return <Label>{'local'}</Label>;

	if (!parsed.prerelease)
		return null;

	return <Label>{parsed.prerelease}</Label>;
};

const Label = styled.div`
	border: 2px solid ${p => toHexAlpha(p.theme.ui.primaryFill, 0.9)};
	border-radius: 6px;
	padding: 2px 4px;
	font-size: 12px;

	background: ${p => toHexAlpha(p.theme.ui.primaryFill, 0.5)};
`;

export default ActionBarVersion;
