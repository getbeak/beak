import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { Select } from '@beak/ui/components/atoms/Input';
import { ipcNestService, ipcPreferencesService } from '@beak/ui/lib/ipc';
import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { ItemGroup, ItemInfo, ItemLabel, ItemSpacer } from '../atoms/item';
import Pane from '../molecules/Pane';

const EngineeringPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [environment, setEnvironment] = useState<string | undefined>(void 0);
	const [hasAuth, setHasAuth] = useState(false);

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getEnvironment().then(env => {
			if (!cancelled) setEnvironment(env);
		});
		ipcNestService.hasAuth().then(auth => {
			if (!cancelled) setHasAuth(auth);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<Pane title={'Shhh…'}>
			<ItemGroup>
				<ItemLabel>{'Environment'}</ItemLabel>
				<Select
					$beakSize='md'
					aria-label='Environment'
					disabled={environment === void 0}
					value={environment}
					onChange={e => {
						setEnvironment(e.target.value);
						ipcPreferencesService.switchEnvironment(e.target.value);
					}}
				>
					<option value={'prod'}>{'Production'}</option>
					<option value={'nonprod'}>{'Non-production'}</option>
				</Select>
				<ItemInfo>{'Switching environments may sign you out.'}</ItemInfo>
			</ItemGroup>

			<ItemGroup>
				<ItemLabel>{'Maintenance'}</ItemLabel>
				<Flex gap='2'>
					<Button colour='secondary' size='sm' onClick={() => ipcPreferencesService.resetConfig()}>
						{'Reset config & cache'}
					</Button>
				</Flex>
				<ItemInfo>{'Clears local preferences and cached responses. Project files are not affected.'}</ItemInfo>
			</ItemGroup>

			{hasAuth && (
				<Box
					mt='6'
					borderRadius='md'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 22%, var(--beak-colors-border-subtle))'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, transparent)'
					p='3'
					boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-alert) 10%, rgba(0,0,0,0.04)), inset 0 1px 0 color-mix(in srgb, white 12%, transparent)'
					css={{ borderLeft: '3px solid var(--beak-colors-accent-alert)' }}
				>
					<Flex align='center' gap='1.5' mb='1.5'>
						<Flex
							align='center'
							justify='center'
							w='20px'
							h='20px'
							borderRadius='sm'
							bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent)'
							color='accent.alert'
							boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
						>
							<AlertTriangle size={11} strokeWidth={2.2} />
						</Flex>
						<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='accent.alert'>
							{'Danger zone'}
						</Box>
					</Flex>
					<Box fontSize='xs' color='fg.muted' mb='2' lineHeight='1.5'>
						{'Signing out will clear your authentication tokens and require re-authentication on next launch.'}
					</Box>
					<ItemSpacer />
					<Button colour='destructive' size='sm' onClick={() => ipcPreferencesService.signOut()}>
						{'Sign out'}
					</Button>
				</Box>
			)}
		</Pane>
	);
};

export default EngineeringPane;
