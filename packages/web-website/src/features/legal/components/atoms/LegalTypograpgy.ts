import styled from 'styled-components';

export const LastUpdated = styled.p`
	color: ${p => p.theme.ui.textMinor};
`;

export const LegalTlDr = styled.p`
	margin-top: 30px;
	font-size: 15px;
	color: ${p => p.theme.ui.textMinor};

	&:before {
		margin-right: 8px;
		content: '>';
	}
`;
