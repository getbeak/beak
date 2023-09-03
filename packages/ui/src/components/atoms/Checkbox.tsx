import React from 'react';
import styled from 'styled-components';

interface CheckboxProps extends React.HTMLProps<HTMLInputElement> {
	label: string;
}

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
`;

const Input = styled.input`
	margin-left: 0;
	margin-right: 5px;
`;

const Label = styled.label`

`;

export default Checkbox;
