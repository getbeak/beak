import React from 'react';
import styled from 'styled-components';

const Header: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => (
	<Container>
		<Logo />
		<Brand>{'Beak'}</Brand>
	</Container>
);

const Container = styled.div`
	display: flex;
	align-items: center;
	padding: 15px 25px;
`;

const Logo = styled.div`
	height: 60px;
	width: 60px;

	background: url('/assets/logo.svg');
	background-position: center;
	background-repeat: no-repeat;
	background-size: 40px;
`;

const Brand = styled.div`
	text-transform: uppercase;
	font-weight: 600;
	font-size: 22px;
	line-height: 24px;
	margin-left: 10px;
`;

export default Header;
