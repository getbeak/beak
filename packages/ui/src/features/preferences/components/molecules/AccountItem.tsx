import { Box, Flex } from '@chakra-ui/react';
import { ipcNestService } from '@beak/ui/lib/ipc';
import { CircleUserRound } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

const AccountItem: React.FC = () => {
	const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		ipcNestService
			.getUser()
			.then(user => {
				if (cancelled) return;
				const identifiers = user.identifiers
					.filter(i => i.identifierType === 'email' && i.removedAt === null)
					.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

				const verifiedEmail = identifiers.find(i => i.verifiedAt !== null);
				const backup = identifiers[0];

				if (!backup) return;

				setPrimaryEmail((verifiedEmail ?? backup).identifierValue);
			})
			.catch(() => { if (!cancelled) setPrimaryEmail(null); });
		return () => {
			cancelled = true;
		};
	}, []);

	if (!primaryEmail) return null;

	return (
		<Flex
			align='center'
			gap='2.5'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, var(--beak-colors-border-subtle))'
			p='3'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)'
			boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 8%, rgba(0,0,0,0.04)), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
			color='fg.muted'
		>
			<Flex
				flex='0 0 auto'
				align='center'
				justify='center'
				w='34px'
				h='34px'
				borderRadius='full'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
				color='accent.pink'
				boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
			>
				<CircleUserRound size={17} strokeWidth={1.8} />
			</Flex>
			<Box minW={0} flex='1 1 auto'>
				<Box
					fontSize='10px'
					fontWeight='700'
					letterSpacing='0.06em'
					textTransform='uppercase'
					color='accent.teal'
					mb='0.5'
				>
					{'Signed in'}
				</Box>
				<Box
					title={primaryEmail}
					overflow='hidden'
					whiteSpace='nowrap'
					textOverflow='ellipsis'
					fontSize='sm'
					fontWeight='600'
					color='fg.default'
					fontFamily='mono'
				>
					{primaryEmail}
				</Box>
			</Box>
		</Flex>
	);
};

export default AccountItem;
