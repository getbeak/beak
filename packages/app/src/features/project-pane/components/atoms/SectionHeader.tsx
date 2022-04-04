import styled from 'styled-components';

const SectionHeader = styled.div<{ collapsed: boolean }>`
	/* border-top: 1px solid ${props => props.theme.ui.backgroundBorderSeparator}; */
	text-transform: uppercase;
	padding: 6px 5px;
	font-size: 11px;
	font-weight: 600;

	display: flex;
	justify-content: space-between;

	cursor: pointer;

	> svg {
		margin-top: 1px;

		cursor: pointer;
	}
`;

export default SectionHeader;
