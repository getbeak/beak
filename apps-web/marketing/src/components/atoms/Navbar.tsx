import { NavLink } from 'react-router-dom';
import styled, { css } from 'styled-components';

import Container from './Container';

export const NavBrand = styled.a`
	display: flex;
	flex-direction: row;
	align-items: center;

	grid-column: 1;
	grid-row: 1;

	text-transform: uppercase;
	font-weight: 600;
	font-size: 22px;
	line-height: 24px;

	color: ${p => p.theme.ui.textOnSurfaceBackground};
	text-decoration: none;
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

export const NavItemLocal = styled(NavLink)`
	padding: 5px 10px;
	margin: 0 8px;

	font-size: 14px;
	text-decoration: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};

	transition: color .2s ease;

	&:hover {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
`;

export const NavItemExternal = styled.a`
	padding: 5px 10px;
	margin: 0 8px;

	font-size: 14px;
	text-decoration: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};

	transition: color .2s ease;

	&:hover {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
`;

export const NavItems = styled.div<{ $expand: boolean }>`
	grid-column: 2;
	grid-row: 1;

	margin: 0 auto;

	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-evenly;

	@media (max-width: 676px) {
		display: block;
		pointer-events: none;
		opacity: 0;

		transform: rotateX(-30deg);
		transform-origin: 0 0;
		transform-style: preserve-3d;

		${p => p.$expand && css`
			pointer-events: all;
			opacity: 1;

			transform: rotateX(0deg);
		`}

		position: absolute;
		top: 77px; left: 0; right: 0;
		flex-direction: column;

		padding: 0 20px;
		padding-top: 20px;
		padding-bottom: 10px;
		border-bottom: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};

		background: ${p => p.theme.ui.secondaryBackground};
		box-shadow: 0px 16px 20px 0px ${p => p.theme.ui.surfaceBorderSeparator}CC;
		backdrop-filter: blur(20px);

		transition: all ease .3s;
		transition-property: opacity transform;

		> ${NavItemLocal}, > ${NavItemExternal} {
			display: block;
			background: ${p => p.theme.ui.background};
			color: ${p => p.theme.ui.textOnSurfaceBackground};
			margin-bottom: 10px;
			padding: 10px;

			font-weight: 700;
			text-align: center;

			border-radius: 10px;

			&:hover {
				color: ${p => p.theme.ui.textMinor};
			}
		}
	}
`;

export const NavDropdown = styled.button`
	background: ${p => p.theme.ui.textOnSurfaceBackground};
	border: none;
	color: ${p => p.theme.ui.background};
	border-radius: 4px;
	cursor: pointer;

	text-align: center;
	width: 40px; height: 40px;

	> svg {
		margin-top: 2px;
		height: 1.2em !important;
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

		> ${NavDropdown} {
			display: none;
		}
	}

	@media (max-width: 676px) {
		> ${Container} {
			display: flex;
			justify-content: space-between;

			> ${NavDropdown} {
				display: inline-block;
			}
		}
	}
`;

export default Navbar;
