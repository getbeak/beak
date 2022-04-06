import { ReflexElement as RE, ReflexElementProps as REP } from 'react-reflex';
import styled, { css } from 'styled-components';

// TODO(afr): Get rid of importants when css import is removed

export interface ReflexElementProps extends REP {
	$forcedWidth?: number;
}

const ReflexElement = styled(RE)<ReflexElementProps>`
	${p => p.$forcedWidth !== void 0 && css`
		width: ${p.$forcedWidth}px;
		min-width: ${p.$forcedWidth}px;
		max-width: ${p.$forcedWidth}px;
	`}
`;

export default ReflexElement;
