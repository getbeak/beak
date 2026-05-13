import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

const headerBase = {
	py: '0.5',
	color: 'fg.default',
} as const;

export const HeaderCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderKeyCell: React.FC<BoxProps> = props => (
	<Box {...headerBase} pl='1.5' {...props} />
);
export const HeaderTypeCell: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;
export const HeaderValueCell: React.FC<BoxProps> = props => (
	<Box {...headerBase} pl='1.5' {...props} />
);
export const HeaderAction: React.FC<BoxProps> = props => <Box {...headerBase} {...props} />;

export const BodyCell: React.FC<BoxProps> = props => <Box {...props} />;

interface BodyPrimaryCellProps extends BoxProps {
	depth: number;
}

export const BodyPrimaryCell: React.FC<BodyPrimaryCellProps> = ({ depth, ...rest }) => (
	<Box display='flex' flexDirection='row' style={{ paddingLeft: `${depth * 10}px` }} {...rest} />
);

export const BodyInputWrapper: React.FC<BoxProps> = props => (
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
			'> input:disabled': { color: 'inherit', userSelect: 'none' },
		}}
		{...props}
	/>
);

export const BodyNullWrapper: React.FC<BoxProps> = props => (
	<Box pl='1.5' lineHeight='20px' {...props} />
);
export const BodyNameOverrideWrapper: React.FC<BoxProps> = props => (
	<Box pl='1.5' lineHeight='20px' {...props} />
);
export const BodyTypeCell: React.FC<BoxProps> = props => <Box {...props} />;
export const BodyInputValueCell: React.FC<BoxProps> = props => <Box {...props} />;
export const BodyLabelValueCell: React.FC<BoxProps> = props => (
	<Box pt='0.5' pl='1.5' {...props} />
);
export const BodyAction: React.FC<BoxProps> = props => <Box {...props} />;
