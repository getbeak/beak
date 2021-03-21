import React from 'react';
import styled from 'styled-components';

interface AlertProps {
	title: string;
	color: 'info';
}

const Alert: React.FunctionComponent<AlertProps> = ({ title, children }) => (
	<Wrapper>
		<b>{title}</b><br />
		{children}
	</Wrapper>
);

const Wrapper = styled.div`
	margin: 0 auto;
	border-radius: 5px;
	background: #5d5da066;
	max-width: 700px;

	padding: 15px 30px;
	text-align: left;
`;

export default Alert;
