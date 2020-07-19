import styled from 'styled-components';

export interface RequestStatusBlobProps {
	status: 'success' | 'warning' | 'failure';
}

const RequestStatusBlob = styled.div<RequestStatusBlobProps>`
	border: 1px solid ${props => props.theme.ui.surfaceBorderSeparator};
	width: 9px; height: 9px;
	border-radius: 100%;
	margin-top: 2px;
	margin-right: 5px;
	
	background-color: ${props => {
		if (props.status === 'success')
			return props.theme.ui.goAction;

		if (props.status === 'warning')
			return 'orange'; // TODO(afr): Use design system here

		if (props.status === 'failure')
			return props.theme.ui.destructiveAction;

		return 'transparent';
	}};
`;

export default RequestStatusBlob;
