import type React from 'react';
import { ReflexElement as RE, ReflexElementProps as REP } from 'react-reflex';
import styled, { css } from 'styled-components';

export interface ReflexElementProps extends REP {
	$forcedWidth?: number;
}

const ReflexElement: React.FC<ReflexElementProps> = styled(RE)<ReflexElementProps>`
	${p => p.minSize && `min-width: ${p.minSize}px;`}

	${p => p.$forcedWidth !== void 0 && css`
		width: ${p.$forcedWidth}px;
		min-width: ${p.$forcedWidth}px;
		max-width: ${p.$forcedWidth}px;
	`}
`;

export default ReflexElement;
