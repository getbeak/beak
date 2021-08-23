
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

import Container from './Container';

export const NavBrand = styled.div`
	display: flex;
	flex-direction: row;

	grid-column: 1;
	grid-row: 1;

	text-transform: uppercase;
	font-weight: 600;
	font-size: 22px;
	line-height: 24px;
`;

export const NavLogo = styled.div`
	display: inline-block;
	background-image: url('/assets/logo.svg');
	background-repeat: no-repeat;
	background-size: contain;
	width: 43px;
	height: 26px;
	margin-right: 15px;
`;

export const NavItems = styled.div`
	grid-column: 2;
	grid-row: 1;

	margin: 0 auto;

	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-evenly;
`;

export const NavItem = styled(NavLink)`
	padding: 5px 10px;
	margin: 0 8px;

	font-size: 14px;
	text-decoration: none;
	color: ${p => p.theme.ui.textMinor};

	transition: color .2s ease;

	&:hover {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
`;

const Navbar = styled.nav`
	position: sticky;
	top: 0;
	width: 100%;
	padding: 25px 0;

	z-index: 101;

	backdrop-filter: blur(10px);
	background: ${p => p.theme.ui.surface}50;
	border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};

	> ${Container} {
		display: grid;
		grid-template-columns: 120px 1fr 120px;
		grid-template-rows: 1fr;
	}

	@media (max-width: 676px) {
		${NavItems} {
			display: none;
		}

		> ${Container} {
			display: flex;
			justify-content: center;
		}
	}
`;

export default Navbar;
