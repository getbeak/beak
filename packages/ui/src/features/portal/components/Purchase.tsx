import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { ipcExplorerService, ipcPreferencesService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { Tags } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

interface PurchaseProps {
	onChangeToTrial: () => void;
}

const Purchase: React.FC<PurchaseProps> = ({ onChangeToTrial }) => {
	const [buyUrl, setBuyUrl] = useState('https://buy.stripe.com/eVa8xY80KedAdWw7ss');
	const [, setPricingUrl] = useState('https://getbeak.app/pricing');

	useEffect(() => {
		getPurchaseInformation().then(({ buyUrl, pricingUrl }) => {
			setBuyUrl(buyUrl);
			setPricingUrl(pricingUrl);
		});
	}, []);

	return (
		<Box w='100%'>
			<Flex direction='column' align='center' gap='1' mb='3'>
				<motion.div
					initial={{ opacity: 0, scale: 0.94 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: 'spring', stiffness: 600, damping: 28 }}
				>
					<Flex
						w='52px'
						h='52px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)'
						color='accent.pink'
						align='center'
						justify='center'
					>
						<Tags size={24} />
					</Flex>
				</motion.div>
				<Box fontSize='xl' fontWeight='600' color='fg.default' mt='1'>
					{'New to Beak?'}
				</Box>
				<Box fontSize='sm' color='fg.muted' textAlign='center' maxW='340px'>
					{"For $25 a year, get access to Beak's full set of powerful features. "}
					{'No hidden fees, no pricing tiers.'}
				</Box>
			</Flex>

			<Flex
				mx='auto'
				my='2'
				maxW='260px'
				direction='column'
				gap='2'
				style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
				css={{ '> button': { width: '100%' } }}
			>
				<Button colour='primary' onClick={() => ipcExplorerService.launchUrl(buyUrl)}>
					{'Buy a subscription'}
				</Button>
				<Button colour='secondary' size='sm' onClick={() => onChangeToTrial()}>
					{'Start a free trial'}
				</Button>
			</Flex>
		</Box>
	);
};

async function getPurchaseInformation() {
	const environment = await ipcPreferencesService.getEnvironment();

	if (environment === 'prod') {
		return {
			buyUrl: 'https://buy.stripe.com/eVa8xY80KedAdWw7ss',
			pricingUrl: 'https://getbeak.app/pricing',
		};
	}

	return {
		buyUrl: 'https://buy.stripe.com/test_14k6p84Zp2V56d27st',
		pricingUrl: 'https://nonprod-getbeak.app/pricing',
	};
}

export default Purchase;
