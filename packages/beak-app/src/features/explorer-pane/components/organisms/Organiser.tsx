import React from 'react';
import styled from 'styled-components';

const Organiser: React.FunctionComponent = () => (
	<Container>
		<button>{'+'}</button>
		<button>{'f'}</button>
		{' | '}
		<button>{'s'}</button>
		<input />
	</Container>
);

const Container = styled.div`
	border-top: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
`;

export default Organiser;
