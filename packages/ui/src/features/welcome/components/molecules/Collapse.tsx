import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';
import { useState } from 'react';

export interface CollapseProps {
	startOpen: boolean;
	title: string;
}

const Collapse: React.FC<React.PropsWithChildren<CollapseProps>> = ({ children, startOpen, title }) => {
	const [show, setShow] = useState(startOpen);

	return (
		<Box>
			<Flex cursor='pointer' align='center' onClick={() => setShow(!show)}>
				<Box display='inline-flex' justifyContent='center' w='5'>
					<Box
						display='inline-block'
						w='0'
						h='0'
						borderTop='5px solid transparent'
						borderBottom='5px solid transparent'
						borderLeft='5px solid'
						borderLeftColor='fg.default'
						transform={show ? 'rotate(90deg)' : undefined}
					/>
				</Box>
				<Box as='span' fontSize='lg' fontWeight='medium'>
					{title}
				</Box>
			</Flex>
			{show && (
				<Box mx='1.5'>
					{children}
				</Box>
			)}
		</Box>
	);
};

export default Collapse;
