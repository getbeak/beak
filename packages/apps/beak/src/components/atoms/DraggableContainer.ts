import styled from 'styled-components';

const DraggableContainer = styled.div`
	-webkit-app-region: drag;

	* {
		pointer-events: none;
	}
`;

export default DraggableContainer;
