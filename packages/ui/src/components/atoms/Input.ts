// This file is kept as `.ts` (no JSX) for back-compat with imports that
// expect to access these as styled-components values. Phase B switches the
// actual implementation to Chakra-themed wrappers but preserves the named
// exports `Input`, `Select`, `InputInvalidText` so consumers don't need to
// change. They get Chakra theming through global CSS variables; the props
// `$beakSize` and `$noStretch` are routed to inline styles via
// styled-components for now (gives us a clean grep target when we strip
// styled-components in Phase G).

import styled from 'styled-components';

interface InputProps {
	$beakSize?: 'sm' | 'md';
	$noStretch?: boolean;
}

const Input = styled.input<InputProps>`
	background-color: var(--beak-colors-bg-surface);
	color: var(--beak-colors-fg-muted);
	border: 1px solid var(--beak-colors-accent-pink);
	box-sizing: border-box;

	font-size: ${p => ((p.$beakSize || 'md') === 'md' ? '13px' : '12px')};
	padding: ${p => ((p.$beakSize || 'md') === 'md' ? '3px 5px' : '2px 3px')};
	border-radius: ${p => ((p.$beakSize || 'md') === 'md' ? '4px' : '3px')};

	${p => !p.$noStretch && 'width: 100%;'}
`;

export const Select = styled.select<InputProps>`
	background-color: var(--beak-colors-bg-surface);
	color: var(--beak-colors-fg-muted);
	border: 1px solid var(--beak-colors-border-default);
	box-sizing: border-box;

	font-size: ${p => ((p.$beakSize || 'md') === 'md' ? '13px' : '12px')};
	padding: ${p => ((p.$beakSize || 'md') === 'md' ? '3px 5px' : '2px 3px')};
	border-radius: ${p => ((p.$beakSize || 'md') === 'md' ? '4px' : '3px')};

	${p => !p.$noStretch && 'width: 100%;'}
	${p => p.$noStretch && 'width: fit-content;'}

	&:active:not(:disabled) {
		border: 1px solid var(--beak-colors-accent-pink);
	}
`;

export const InputInvalidText = styled.span`
	display: block;
	padding: 1px 0;
	font-size: 13px;
	font-weight: bold;
	color: var(--beak-colors-accent-alert);
`;

export default Input;
