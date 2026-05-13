import { chakra } from '@chakra-ui/react';

export const HeaderCell = chakra('div', {
	base: {
		py: '0.5',
		color: 'fg.default',
	},
});
export const HeaderKeyCell = chakra('div', {
	base: {
		py: '0.5',
		pl: '1.5',
		color: 'fg.default',
	},
});
export const HeaderValueCell = chakra('div', {
	base: {
		py: '0.5',
		pl: '1.5',
		color: 'fg.default',
	},
});
export const HeaderAction = chakra('div', {
	base: {
		py: '0.5',
		color: 'fg.default',
	},
});

export const BodyCell = chakra('div', {});
export const BodyPrimaryCell = chakra('div', {
	base: {
		display: 'flex',
		flexDirection: 'row',
	},
});
import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

export const BodyInputWrapper: React.FC<BoxProps> = ({ children, ...rest }) => (
	<Box
		flexGrow={1}
		css={{
			'> div > article, > input[type=text]': {
				width: 'calc(100% - 10px)',
				height: 'calc(100% - 5px)',
				border: '1px solid transparent',
				background: 'none',
				padding: '2px 5px',
				margin: '0',
				fontSize: '12px',
				color: 'var(--beak-colors-fg-muted)',
			},
			'> input:disabled': {
				color: 'inherit',
				userSelect: 'none',
			},
		}}
		{...rest}
	>
		{children}
	</Box>
);
export const BodyInputValueCell = chakra('div', {});
export const BodyAction = chakra('div', {});
