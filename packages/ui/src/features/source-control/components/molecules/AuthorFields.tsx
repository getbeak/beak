import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

import Input from '../../../../components/atoms/Input';
import type { GitAuthor } from '../../hooks/use-git-author';

interface AuthorFieldsProps {
	author: GitAuthor;
	onChange: (next: GitAuthor) => void;
	disabled?: boolean;
}

const AuthorFields: React.FC<AuthorFieldsProps> = ({ author, onChange, disabled }) => (
	<Flex direction='column' gap='2'>
		<Flex direction='column' gap='1'>
			<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
				{'Author name'}
			</Box>
			<Input
				$beakSize='md'
				value={author.name}
				placeholder='Jane Smith'
				onChange={e => onChange({ ...author, name: e.currentTarget.value })}
				disabled={disabled}
			/>
		</Flex>
		<Flex direction='column' gap='1'>
			<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
				{'Author email'}
			</Box>
			<Input
				$beakSize='md'
				value={author.email}
				placeholder='jane@example.com'
				onChange={e => onChange({ ...author, email: e.currentTarget.value })}
				disabled={disabled}
			/>
		</Flex>
	</Flex>
);

export default AuthorFields;
