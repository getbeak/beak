import { Link, type LinkProps } from '@chakra-ui/react';
import type React from 'react';

type Tone = 'primary' | 'secondary' | 'tertiary';

interface CtaButtonProps extends Omit<LinkProps, 'variant'> {
	tone?: Tone;
}

const toneStyles: Record<Tone, LinkProps> = {
	primary: {
		bg: 'primaryFill',
		color: 'textOnAction',
		_hover: { boxShadow: '0 0 20px 6px rgba(212, 93, 128, 0.6)' },
	},
	secondary: {
		bg: 'secondarySurface',
		color: 'textOnFill',
		_hover: { boxShadow: '0 0 20px 6px rgba(236, 236, 236, 0.6)' },
	},
	tertiary: {
		bg: 'surfaceHighlight',
		color: 'textOnFill',
		_hover: { boxShadow: '0 0 20px 6px rgba(243, 243, 243, 0.6)' },
	},
};

const CtaButton: React.FC<CtaButtonProps> = ({ tone = 'primary', children, ...rest }) => (
	<Link
		display='block'
		borderRadius='5px'
		px='20px'
		py='10px'
		mx='15px'
		fontSize='16px'
		textDecoration='none'
		transition='box-shadow .2s ease'
		_hover={{ textDecoration: 'none' }}
		css={{
			'@media (max-width: 676px)': { fontSize: '16px', padding: '10px 30px', margin: 0 },
		}}
		{...toneStyles[tone]}
		{...rest}
	>
		{children}
	</Link>
);

export default CtaButton;
