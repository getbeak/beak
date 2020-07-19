import React from 'react';
import styled from 'styled-components';

const Organiser: React.FunctionComponent = () => (
	<Container>
		<Button>{'+'}</Button>
		<Button>{'⊞'}</Button>
		{' | '}
		<Button>{'⎈'}</Button>
		<SearchBox placeholder={'search...'} />
	</Container>
);

const Container = styled.div`
	display: flex;
	padding: 4px 6px;
	padding-left: 2px;
	border-top: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
`;

const Button = styled.button`
	background: transparent;
	border: none;
	color: ${props => props.theme.ui.textOnSurfaceBackground};
`;

const SearchBox = styled.input`
	flex-grow: 2;
	background: transparent;
	border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	border-radius: 2px;

	min-width: 70px;
	font-size: 12px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};

	&:focus {
		outline: none;
		border-color: ${props => props.theme.ui.primaryFill};
	}
`;

export default Organiser;
