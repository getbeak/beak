import { Box } from '@chakra-ui/react';
import * as React from 'react';

const ActionBarSeparator: React.FC = () => (
	<Box
		h='16px'
		w='1px'
		mx='2'
		alignSelf='center'
		bg='linear-gradient(to bottom, transparent, color-mix(in srgb, var(--beak-colors-border-default) 70%, transparent) 25%, color-mix(in srgb, var(--beak-colors-border-default) 70%, transparent) 75%, transparent)'
	/>
);

export default ActionBarSeparator;
