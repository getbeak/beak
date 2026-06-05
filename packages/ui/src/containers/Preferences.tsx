import { Box } from '@chakra-ui/react';
import * as React from 'react';
import { useState } from 'react';

import SegmentedControl from '../features/preferences/components/atoms/SegmentedControl';
import EditorPane from '../features/preferences/components/organisms/EditorPane';
import EngineeringPane from '../features/preferences/components/organisms/EngineeringPane';
import GeneralPane from '../features/preferences/components/organisms/GeneralPane';

type SectionKey = 'general' | 'editor' | 'advanced';

const SECTIONS = [
	{ key: 'general' as const, label: 'General' },
	{ key: 'editor' as const, label: 'Editor' },
	{ key: 'advanced' as const, label: 'Advanced' },
];

const Preferences: React.FC = () => {
	const [active, setActive] = useState<SectionKey>('general');

	return (
		<Box h='100%' overflowY='auto' bg='bg.canvas'>
			<Box maxW='760px' mx='auto' px='8' pt='9' pb='12'>
				<Box fontSize='3xl' fontWeight='700' letterSpacing='-0.02em' lineHeight='1.05' color='fg.default'>
					{'Settings'}
				</Box>
				<Box fontSize='sm' color='fg.subtle' mt='1' mb='5'>
					{'Configure Beak to match the way you work.'}
				</Box>

				<Box
					h='1px'
					mb='5'
					bg='linear-gradient(to right, color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent), color-mix(in srgb, var(--beak-colors-border-default) 55%, transparent) 30%, transparent 100%)'
				/>

				<Box mb='6'>
					<SegmentedControl ariaLabel='Preferences section' items={SECTIONS} value={active} onChange={setActive} />
				</Box>

				<Box>
					{active === 'general' && <GeneralPane />}
					{active === 'editor' && <EditorPane />}
					{active === 'advanced' && <EngineeringPane />}
				</Box>
			</Box>
		</Box>
	);
};

export default Preferences;
