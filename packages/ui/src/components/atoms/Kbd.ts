import styled from 'styled-components';

const Kbd = styled.kbd`
	display: inline-block;
	border-style: solid;
	border-width: 1px;
	border-radius: 3px;
	vertical-align: middle;
	padding: 3px 5px;
	margin: 0 2px;

	font-family: -apple-system,BlinkMacSystemFont,sans-serif;
	font-size: 9px;
	line-height: 8px;
	
	color: var(--beak-colors-fg-default);
	background-color: var(--beak-colors-bg-surface-emphasized);
	border-color: var(--beak-colors-border-default);
	box-shadow: rgb(0 0 0 / 16%) 0px -1px 0px inset;

	&:first-child {
		margin-left: 0;
	}
`;

export default Kbd;
