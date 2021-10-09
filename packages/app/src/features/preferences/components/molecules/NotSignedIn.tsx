import { toHexAlpha } from '@beak/design-system/utils';
import { faDove } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled, { useTheme } from 'styled-components';

const NotSignedIn: React.FunctionComponent = () => {
	const theme = useTheme();

	return (
		<Wrapper>
			<FontAwesomeIcon
				icon={faDove}
				size={'1x'}
				color={theme.ui.primaryFill}
			/>
			<br />
			{'taylor.swift@getbeak.app'}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	border-radius: 10px;
	font-size: 14px;
	padding: 10px;
	background: ${p => toHexAlpha(p.theme.ui.surface, 0.25)};
	color: ${p => p.theme.ui.textMinor};
`;

export default NotSignedIn;
