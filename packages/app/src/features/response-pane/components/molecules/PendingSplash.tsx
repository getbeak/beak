import React from 'react';
import { faDove } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

const PendingSlash: React.FunctionComponent = () => {
	const theme = useTheme();

	return (
		<Wrapper>
			<FontAwesomeIcon
				icon={faDove}
				color={theme.ui.surfaceFill}
				size={'10x'}
			/>
			<Text>
				{'Make a request to get started'}
			</Text>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	display: flex;
	width: 100%;
	height: 100%;

	align-items: center;
	justify-content: center;
	flex-direction: column;
`;

const Text = styled.div`
	color: ${p => p.theme.ui.textMinorMuted};
	font-weight: 200;
	font-size: 35px;
	margin-top: 25px;
	padding: 0 20px;
	text-align: center;
`;

export default PendingSlash;
