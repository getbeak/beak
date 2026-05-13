import React from 'react';
import styled from 'styled-components';

interface CheckboxProps extends React.HTMLProps<HTMLInputElement> {
	label: string;
}

/**
 * Beak's labelled checkbox. Phase B keeps this as a thin styled wrapper
 * over the native input but pulls its accent colour from the new Chakra
 * CSS variables so the brand pink is consistent with the rest of the
 * Chakra-themed chrome.
 */
const Checkbox: React.FC<CheckboxProps> = props => {
	const { label, ...rest } = props;

	return (
		<Container>
			<Input type={'checkbox'} {...rest} />
			<Label htmlFor={props.id}>{label}</Label>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
`;

const Input = styled.input`
	margin: 0;
	accent-color: var(--beak-colors-accent-pink);
`;

const Label = styled.label`
	color: var(--beak-colors-fg-muted);
	font-size: 12px;
`;

export default Checkbox;
