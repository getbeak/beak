import { Box, Flex, Grid } from '@chakra-ui/react';
import { AppWindow, ReceiptText, ShieldUser, SquarePen } from 'lucide-react';
import * as React from 'react';
import { useContext, useState } from 'react';

import WindowSessionContext from '../contexts/window-session-context';
import AccountItem from '../features/preferences/components/molecules/AccountItem';
import EditorPane from '../features/preferences/components/organisms/EditorPane';
import EngineeringPane from '../features/preferences/components/organisms/EngineeringPane';
import GeneralPane from '../features/preferences/components/organisms/GeneralPane';
import SubscriptionPane from '../features/preferences/components/organisms/SubscriptionPane';

const blankFill = 'var(--beak-colors-fg-onAccent)';
const primaryFill = 'var(--beak-colors-accent-pink)';

interface SidebarItemProps {
	active: boolean;
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ active, icon, label, onClick }) => (
	<Flex
		w='calc(100% - 20px)'
		p='2.5'
		borderRadius='lg'
		mb='1.5'
		color={active ? 'fg.onAccent' : 'fg.default'}
		bg={active ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 75%, transparent)' : undefined}
		cursor='pointer'
		_hover={active ? undefined : { bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)' }}
		_last={{ mb: '0' }}
		css={{ '> svg': { width: '1.25em !important', marginRight: '10px' }, '> span': { marginTop: '-2px' } }}
		onClick={onClick}
	>
		{icon}
		<span>{label}</span>
	</Flex>
);

const About: React.FC = () => {
	const windowSession = useContext(WindowSessionContext);
	const [tab, setTab] = useState('general');
	const darwin = windowSession.isDarwin();

	return (
		<Grid templateRows='1fr' templateColumns='.25fr 1px .75fr' h='100%'>
			<Box
				px='2.5'
				pt={darwin ? '10' : '5'}
				pb='5'
				h={darwin ? 'calc(100% - 60px)' : '100%'}
				overflowY='auto'
				style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
				css={{ '> *': { WebkitAppRegion: 'no-drag' } }}
			>
				<Box h='2.5' />
				<AccountItem />
				<Box h='2.5' />
				<SidebarItem
					active={tab === 'general'}
					icon={<AppWindow color={tab === 'general' ? blankFill : primaryFill} />}
					label='General'
					onClick={() => setTab('general')}
				/>
				<SidebarItem
					active={tab === 'editor'}
					icon={<SquarePen color={tab === 'editor' ? blankFill : primaryFill} />}
					label='Rich text editor'
					onClick={() => setTab('editor')}
				/>
				<SidebarItem
					active={tab === 'subscription'}
					icon={<ReceiptText color={tab === 'subscription' ? blankFill : primaryFill} />}
					label='Subscription'
					onClick={() => setTab('subscription')}
				/>
				<SidebarItem
					active={tab === 'engineering'}
					icon={<ShieldUser color={tab === 'engineering' ? blankFill : primaryFill} />}
					label='Shhh...'
					onClick={() => setTab('engineering')}
				/>
			</Box>
			<Box bg='border.default' />
			<Box bg='bg.canvas'>
				{tab === 'general' && <GeneralPane />}
				{tab === 'editor' && <EditorPane />}
				{tab === 'subscription' && <SubscriptionPane />}
				{tab === 'engineering' && <EngineeringPane />}
			</Box>
		</Grid>
	);
};

export default About;
