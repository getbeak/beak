import { Flex } from '@chakra-ui/react';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';

interface FormErrorProps {
	children: React.ReactNode;
}

const FormError: React.FC<FormErrorProps> = ({ children }) => (
	<Flex
		align='center'
		gap='1'
		mt='1'
		fontSize='xs'
		color='accent.alert'
		role='alert'
	>
		<AlertCircle size={11} />
		<span>{children}</span>
	</Flex>
);

export default FormError;
