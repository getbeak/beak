import { Box, Grid } from '@chakra-ui/react';
import CtaButton from '@beak/apps-web-share/components/atoms/Buttons';
import { SubTitle, Title } from '@beak/apps-web-share/components/atoms/Typography';
import useBeakProjectUrl from '@beak/apps-web-share/hooks/use-beak-project-url';
import * as React from 'react';
import { useEffect } from 'react';

const InfoCard: React.FC = () => {
	const beakUrl = useBeakProjectUrl();

	useEffect(() => {
		window.location.href = beakUrl;
	}, [beakUrl]);

	return (
		<Grid templateColumns='150px 1fr' gap='5' borderRadius='lg' bg='bg.surface' p='6'>
			<Box
				bgImage="url('/assets/logo-tile.png')"
				bgPos='center'
				bgRepeat='no-repeat'
				bgSize='100px'
				h='100px'
			/>
			<Box>
				<Title>{'Someone has shared a Beak with you'}</Title>
				<SubTitle>
					{"Someone has shared a beak project with you, if Beak doesn't launch automatically, you can "}
					{'tap the button below.'}
				</SubTitle>
				<Box mt='5'>
					<CtaButton
						$style='primary'
						onClick={() => {
							window.location.href = beakUrl;
						}}
					>
						{'Launch Beak'}
					</CtaButton>
				</Box>
			</Box>
		</Grid>
	);
};

export default InfoCard;
