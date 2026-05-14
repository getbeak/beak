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
		role='tab'
		tabIndex={0}
		aria-selected={active}
		align='center'
		gap='2.5'
		w='100%'
		px='2.5'
		py='2'
		borderRadius='md'
		mb='1'
		fontSize='sm'
		fontWeight={active ? '600' : '500'}
		color={active ? 'fg.onAccent' : 'fg.default'}
		bg={active ? 'accent.pink' : 'transparent'}
		boxShadow={active ? '0 4px 14px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)' : undefined}
		cursor='pointer'
		transition='background-color .14s ease, color .14s ease, box-shadow .14s ease, transform .08s ease'
		_hover={active ? undefined : {
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
			color: 'accent.pink',
		}}
		_focusVisible={{
			outline: 'none',
			boxShadow: active
				? '0 4px 14px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent), 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)'
				: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
		}}
		_active={{ transform: 'scale(0.99)' }}
		_last={{ mb: '0' }}
		css={{ '> svg': { width: '15px !important', height: '15px !important', flexShrink: 0 } }}
		onClick={onClick}
		onKeyDown={(event: React.KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onClick();
			}
		}}
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
				<Box
					id='preferences-section-heading'
					mb='1.5'
					fontSize='10px'
					fontWeight='700'
					letterSpacing='0.06em'
					textTransform='uppercase'
					color='fg.subtle'
					px='1'
				>
					{'Settings'}
				</Box>
				<Box role='tablist' aria-labelledby='preferences-section-heading'>
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
					label='Shhh…'
					onClick={() => setTab('engineering')}
				/>
				</Box>
			</Box>
			<Box bg='linear-gradient(to bottom, transparent, color-mix(in srgb, var(--beak-colors-border-default) 70%, transparent) 12%, color-mix(in srgb, var(--beak-colors-border-default) 70%, transparent) 88%, transparent)' />
			<Box role='tabpanel' bg='bg.canvas'>
				{tab === 'general' && <GeneralPane />}
				{tab === 'editor' && <EditorPane />}
				{tab === 'subscription' && <SubscriptionPane />}
				{tab === 'engineering' && <EngineeringPane />}
			</Box>
		</Grid>
	);
};

export default About;
