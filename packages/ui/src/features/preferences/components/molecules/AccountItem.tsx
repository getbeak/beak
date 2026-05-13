import { Box, Flex } from '@chakra-ui/react';
import { ipcNestService } from '@beak/ui/lib/ipc';
import { CircleUserRound } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

const AccountItem: React.FC = () => {
	const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);

	useEffect(() => {
		ipcNestService
			.getUser()
			.then(user => {
				const identifiers = user.identifiers
					.filter(i => i.identifierType === 'email' && i.removedAt === null)
					.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

				const verifiedEmail = identifiers.find(i => i.verifiedAt !== null);
				const backup = identifiers[0];

				if (!backup) return;

				setPrimaryEmail((verifiedEmail ?? backup).identifierValue);
			})
			.catch(() => setPrimaryEmail(null));
	}, []);

	if (!primaryEmail) return null;

	return (
		<Flex
			align='center'
			borderRadius='lg'
			p='2.5'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 25%, transparent)'
			color='fg.muted'
		>
			<CircleUserRound color='var(--beak-colors-accent-pink)' />
			<Box ml='2.5' overflow='hidden'>
				<Box fontSize='xl' fontWeight='medium' color='fg.default'>{'Beak'}</Box>
				<Box
					as='abbr'
					title={primaryEmail}
					display='block'
					overflow='hidden'
					wordWrap='break-word'
					whiteSpace='nowrap'
					textOverflow='ellipsis'
					fontSize='sm'
					textDecoration='none'
				>
					{primaryEmail}
				</Box>
			</Box>
		</Flex>
	);
};

export default AccountItem;
