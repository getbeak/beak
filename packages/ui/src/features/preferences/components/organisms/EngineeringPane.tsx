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
		ipcPreferencesService.getEnvironment().then(setEnvironment);
		ipcNestService.hasAuth().then(setHasAuth);
	}, []);

	return (
		<Pane title={'Shhh…'}>
			<ItemGroup>
				<ItemLabel>{'Environment'}</ItemLabel>
				<Select
					$beakSize='md'
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
					<Button size='sm' onClick={() => ipcPreferencesService.resetConfig()}>
						{'Reset config & cache'}
					</Button>
				</Flex>
			</ItemGroup>

			{hasAuth && (
				<Box
					mt='6'
					borderRadius='md'
					borderWidth='1px'
					borderColor='border.subtle'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, transparent)'
					p='3'
					css={{ borderLeft: '3px solid var(--beak-colors-accent-alert)' }}
				>
					<Flex align='center' gap='1.5' mb='1.5' color='accent.alert'>
						<AlertTriangle size={13} />
						<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em'>
							{'Danger zone'}
						</Box>
					</Flex>
					<Box fontSize='xs' color='fg.muted' mb='2'>
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
