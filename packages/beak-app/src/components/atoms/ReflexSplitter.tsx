import { ReflexSplitter as RS } from 'react-reflex';
import styled from 'styled-components';

// TODO(afr): Get rid of importants when css import is removed

const ReflexSplitter = styled(RS)`
	width: 2px !important;
	background-color: ${props => props.theme.ui.backgroundBorderSeparator} !important;
	border: none !important;
`;

export default ReflexSplitter;
