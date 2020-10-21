import { statusToColour } from '@beak/app/design-system/helpers';
import styled from 'styled-components';

export interface RequestStatusBlobProps {
	$status: number;
}

const RequestStatusBlob = styled.div<RequestStatusBlobProps>`
	border: 1px solid ${props => props.theme.ui.surfaceBorderSeparator};
	width: 9px; height: 9px;
	border-radius: 100%;
	margin-top: 4px;
	margin-right: 5px;
	
	background-color: ${p => statusToColour(p.$status)};
`;

export default RequestStatusBlob;
