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
		<Grid
			templateColumns='150px 1fr'
			gap='5'
			borderRadius='xl'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 80%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 22%, var(--beak-colors-border-subtle))'
			p='6'
			style={{
				boxShadow: '0 16px 40px rgba(0,0,0,0.18), 0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)',
			}}
		>
			<Box
				bgImage="url('/assets/logo-tile.png')"
				bgPos='center'
				bgRepeat='no-repeat'
				bgSize='100px'
				h='100px'
				w='100px'
				mx='auto'
				borderRadius='lg'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
				style={{
					boxShadow: '0 8px 24px color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)',
				}}
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
