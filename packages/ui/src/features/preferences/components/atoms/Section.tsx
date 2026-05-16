import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface SectionProps {
	title: string;
	description?: string;
	children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, children }) => (
	<Box
		mb='5'
		bg='bg.surface'
		borderWidth='1px'
		borderStyle='solid'
		borderColor='border.subtle'
		borderRadius='lg'
		overflow='hidden'
		boxShadow='0 1px 0 color-mix(in srgb, var(--beak-colors-gray-950) 4%, transparent)'
	>
		<Box
			px='5'
			py='3'
			bg='bg.surface.alt'
			borderBottomWidth='1px'
			borderBottomStyle='solid'
			borderBottomColor='border.subtle'
		>
			<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
				{title}
			</Box>
			{description && (
				<Box fontSize='xs' color='fg.subtle' mt='0.5' lineHeight='1.45'>
					{description}
				</Box>
			)}
		</Box>
		<Box>{children}</Box>
	</Box>
);

export default Section;
