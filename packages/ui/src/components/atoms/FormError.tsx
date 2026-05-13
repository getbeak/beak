import { Flex } from '@chakra-ui/react';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';

interface FormErrorProps {
	children: React.ReactNode;
}

const FormError: React.FC<FormErrorProps> = ({ children }) => (
	<Flex
		align='flex-start'
		gap='1.5'
		mt='1.5'
		px='2'
		py='1'
		borderRadius='sm'
		borderLeftWidth='2px'
		borderLeftColor='accent.alert'
		bg='color-mix(in srgb, var(--beak-colors-accent-alert) 8%, transparent)'
		fontSize='xs'
		fontWeight='500'
		color='accent.alert'
		role='alert'
	>
		<AlertCircle size={11} strokeWidth={2.2} style={{ marginTop: '1px', flexShrink: 0 }} />
		<span>{children}</span>
	</Flex>
);

export default FormError;
