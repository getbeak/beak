import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
	0% {
		background-color: #f9ba40d3;
	}
	50% {
		background-color: #e09e3aaa;
	}
	100% {
		background-color: #f9ba40d8;
	}
`;

const WarningLabel = styled.div`
	background: #f9ba40;
	cursor: pointer;
	padding: 2px 4px;
	font-size: 11px;
	border-radius: 6px;
	border: 2px solid #f9ba40e6;

	z-index: 101;

	animation: ${pulse} 8s infinite;
`;

export default WarningLabel;
