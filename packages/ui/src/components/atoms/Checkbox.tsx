import { Flex } from '@chakra-ui/react';
import * as React from 'react';

interface CheckboxProps extends React.HTMLProps<HTMLInputElement> {
	label: string;
}

/**
 * Beak's labelled checkbox. A native input wrapped in a Chakra Flex so
 * the accent colour follows the brand pink and the label tracks Chakra
 * tokens automatically.
 */
const Checkbox: React.FC<CheckboxProps> = ({ label, ...rest }) => (
	<Flex align='center' gap='1.5'>
		<input
			type='checkbox'
			{...rest}
			style={{ margin: 0, accentColor: 'var(--beak-colors-accent-pink)' }}
		/>
		<label htmlFor={rest.id} style={{ color: 'var(--beak-colors-fg-muted)', fontSize: '12px' }}>
			{label}
		</label>
	</Flex>
);

export default Checkbox;
