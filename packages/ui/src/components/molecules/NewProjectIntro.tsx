import { Box, SimpleGrid } from '@chakra-ui/react';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import * as React from 'react';

import { useDefaultOrCreateRequest } from '../../hooks/use-default-or-create-request';
import Button from '../atoms/Button';

const NewProjectIntro: React.FC = () => {
	const defaultOrCreateRequest = useDefaultOrCreateRequest();

	return (
		<Box
			w='calc(100% - 300px)'
			h='calc(100% - 200px)'
			px='150px'
			py='100px'
			alignItems='center'
			justifyContent='center'
			flexDirection='column'
			bg='bg.surface'
			overflowY='scroll'
		>
			<Box
				borderRadius='lg'
				py='6'
				px='12'
				bgImage="url('./images/backgrounds/dark-waves.jpg')"
				bgPos='center'
				bgSize='cover'
				bgRepeat='no-repeat'
				css={{ 'html.light &': { backgroundImage: "url('./images/backgrounds/light-waves.jpg')" } }}
			>
				<Box maxW='700px'>
					<Box fontSize='3xl' fontWeight='400' color='fg.onAccent'>{'Welcome to your Beak project'}</Box>
					<Box fontSize='lg' my='4' color='fg.onAccent'>
						{"Welcome to your Beak project. Beak's provides a comprehensive"}
						{'toolkit that will make building, editing, testing, and '}
						{"researching API's super simple."}
						<br />
						<br />
						{'Click the button below to get started with making a request, '}
						{'or you can browse the guides below to learn more about the '}
						{'features Beak has to offer.'}
					</Box>
					<Button onClick={defaultOrCreateRequest}>{'Get started'}</Button>
				</Box>
			</Box>

			<Box mt='8'>
				<Box fontSize='2xl' mb='2.5' color='fg.default'>{'Learn how to get the most out of Beak'}</Box>
				<SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap='10' rowGap='8'>
					<GuidesGridItem
						title='Visit the documentation'
						body='Read and explore about all the features that Beak has to offer.'
						cta='View Beak manual'
						url='https://docs.getbeak.app/'
					/>
					<GuidesGridItem
						title='Variable sets'
						body='Easily share common variables between requests, and group them in sets.'
						cta='Read about variable sets'
						url='https://getbeak.notion.site/Variable-sets-b5e2083aa597496b89006e1a48acf5fb?pvs=74'
					/>
					<GuidesGridItem
						title='Versioning'
						body='Learn how to easily sync changes to your Beak project with your team or community.'
						cta='Read about versioning'
						url='https://getbeak.notion.site/Source-control-versioning-aa9b4d423e614148a10f69d42b3bc746'
					/>
					<GuidesGridItem
						title='Variables'
						body='Variables can be inserted into your request, and are calculated for every request.'
						cta='Read more'
						url='https://www.notion.so/getbeak/Variables-e569e07fec964859926edcab2a3351ac'
					/>
				</SimpleGrid>
			</Box>
		</Box>
	);
};

const GuidesGridItem: React.FC<{ title: string; body: string; cta: string; url: string }> = ({ title, body, cta, url }) => (
	<Box bg='bg.surface' borderWidth='1px' borderColor='border.subtle' borderRadius='md' px='5' py='4'>
		<Box fontSize='xl' color='fg.default'>{title}</Box>
		<Box fontSize='lg' mt='2.5' mb='5' color='fg.muted'>{body}</Box>
		<Button onClick={() => ipcExplorerService.launchUrl(url)}>{cta}</Button>
	</Box>
);

export default NewProjectIntro;
