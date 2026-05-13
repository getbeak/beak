import { Box } from '@chakra-ui/react';
import type Squawk from '@beak/common/utils/squawk';
import EditorView from '@beak/ui/components/atoms/EditorView';
import * as React from 'react';

interface ErrorRendererProps {
	error: Squawk;
}

const ErrorRenderer: React.FC<ErrorRendererProps> = ({ error }) => (
	<Box
		mx='auto'
		mt='5'
		h='100%'
		maxW='700px'
		maxH='450px'
		overflow='hidden'
		borderRadius='md'
		bg='bg.surface'
		borderWidth='2px'
		borderColor='bg.surface'
	>
		<Box
			textAlign='left'
			px='1'
			py='1.5'
			fontSize='xs'
			fontWeight='semibold'
			color='fg.muted'
			textTransform='uppercase'
		>
			{'Error body'}
		</Box>
		<EditorView
			language='json'
			value={JSON.stringify(error, null, '\t')}
			options={{ readOnly: true, lineNumbers: 'off' }}
		/>
	</Box>
);

export default ErrorRenderer;
