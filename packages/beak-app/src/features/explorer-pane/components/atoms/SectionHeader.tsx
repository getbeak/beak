import styled from 'styled-components';

const SectionHeader = styled.div`
	border-top: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	text-transform: uppercase;
	padding: 4px 14px;
	font-size: 9px;
	font-weight: 600;

	cursor: pointer;
`;

export default SectionHeader;
