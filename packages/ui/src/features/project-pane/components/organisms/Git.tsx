import { Box, Flex } from '@chakra-ui/react';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { useAppSelector } from '@beak/ui/store/redux';
import { ChevronDown, GitBranch } from 'lucide-react';
import * as React from 'react';

import NoProjectInformation from '../molecules/NoProjectInformation';

const selectStyle: React.CSSProperties = {
	flex: '1 1 auto',
	minWidth: 0,
	fontSize: '12px',
	fontWeight: 600,
	fontFamily: 'var(--beak-fonts-mono)',
	border: 0,
	background: 'transparent',
	color: 'var(--beak-colors-fg-default)',
	textOverflow: 'ellipsis',
	appearance: 'none',
	WebkitAppearance: 'none',
	MozAppearance: 'none',
	cursor: 'pointer',
	padding: 0,
};

const Git: React.FC = () => {
	const { branches, selectedBranch } = useAppSelector(s => s.global.git)!;

	useSectionBody({ maxHeight: '120px', flexShrink: 0 });

	if (branches.length === 0) {
		return (
			<Box px='1.5' py='1'>
				<NoProjectInformation />
			</Box>
		);
	}

	return (
		<Box px='1.5' py='1'>
			<Flex
				align='center'
				gap='2'
				px='2'
				py='1.5'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 65%, transparent)'
				transition='border-color .12s ease, background-color .12s ease, box-shadow .12s ease'
				_hover={{
					borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 35%, var(--beak-colors-border-subtle))',
				}}
				_focusWithin={{
					borderColor: 'accent.pink',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
				}}
			>
				<Box color='accent.pink' flexShrink={0} display='inline-flex'>
					<GitBranch size={11} strokeWidth={2.2} />
				</Box>
				<select
					value={selectedBranch}
					style={selectStyle}
					onChange={() => undefined}
				>
					{branches.map(b => (
						<option disabled={selectedBranch !== b.name} key={b.name} value={b.name}>
							{b.name}
						</option>
					))}
				</select>
				<Box color='fg.subtle' flexShrink={0} display='inline-flex'>
					<ChevronDown size={10} />
				</Box>
			</Flex>
		</Box>
	);
};

export default Git;
