import styled from 'styled-components';

const BetaBadge = styled.div`
	position: absolute;
	top: -5px; right: -20px;
	padding: 3px 5px;

	transform: rotate(20deg);
	font-size: 15px;

	border-radius: 5px;
	background: ${p => p.theme.ui.primaryFill};
`;

export default BetaBadge;
