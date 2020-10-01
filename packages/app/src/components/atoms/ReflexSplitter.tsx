import { ReflexSplitter as RS, ReflexSplitterProps as RSP } from 'react-reflex';
import styled from 'styled-components';

// TODO(afr): Get rid of importants when css import is removed

export interface ReflexSplitterProps extends RSP {
	orientation: 'horizontal' | 'vertical';
}

const ReflexSplitter = styled(RS)<ReflexSplitterProps>`
	width: ${props => props.orientation === 'vertical' ? '2px' : 'auto'} !important;
	height: ${props => props.orientation === 'horizontal' ? '2px' : 'auto'} !important;
	background-color: ${props => props.theme.ui.backgroundBorderSeparator} !important;
	border: none !important;
`;

export default ReflexSplitter;
