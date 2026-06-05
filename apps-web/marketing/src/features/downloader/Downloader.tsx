import { Box, Grid, Link, Text, useToken } from '@chakra-ui/react';
import { faApple } from '@fortawesome/free-brands-svg-icons/faApple';
import { faWindows } from '@fortawesome/free-brands-svg-icons/faWindows';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import Container from '../../components/Container';
import ScrollTarget from '../../components/ScrollTarget';
import { SubTitle, Title } from '../../components/Typography';
import useDownloadLinks from './use-download-links';

const DownloadButton: React.FC<React.PropsWithChildren<{ href: string }>> = ({ href, children }) => (
	<Link
		href={href}
		mt='10px'
		px='20px'
		py='10px'
		w='calc(100% - 40px)'
		textAlign='center'
		borderRadius='10px'
		bg='primaryFill'
		color='textOnAction'
		textDecoration='none'
		_hover={{ textDecoration: 'none' }}
	>
		{children}
	</Link>
);

const Platform: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box display='flex' flexDir='column' alignItems='center' mb='25px'>
		{children}
	</Box>
);

const Downloader: React.FC = () => {
	const [textOnAction] = useToken('colors', ['textOnAction']);
	const { downloads, getSiliconDownloadPath } = useDownloadLinks();

	if (!downloads) return null;

	return (
		<Box my={{ base: '3vw', md: '60px' }} textAlign='center'>
			<ScrollTarget target='downloads' />

			<Container>
				<Title position='relative' w='fit-content' mx='auto'>
					Download
				</Title>
				<SubTitle>Grab the freshest build of Beak for whatever device you own</SubTitle>

				<Grid templateColumns='repeat(auto-fit, minmax(250px, 1fr))' columnGap='25px' mt='40px'>
					<Platform>
						<Box mb='15px'>
							<FontAwesomeIcon icon={faApple} size='4x' />
						</Box>

						<DownloadButton href={downloads.macOS!.downloadPath}>
							<Box as='span' mr='5px'>
								<FontAwesomeIcon icon={faDownload} color={textOnAction} />
							</Box>
							Download for Mac (Intel)
						</DownloadButton>
						<Text
							mt='5px'
							mb='10px'
							textTransform='uppercase'
							fontWeight={600}
							fontSize='14px'
							color='textOnSurfaceBackground'
						>
							👆 Most common
						</Text>
						<DownloadButton href={getSiliconDownloadPath()}>
							<Box as='span' mr='5px'>
								<FontAwesomeIcon icon={faDownload} color={textOnAction} />
							</Box>
							Download for Mac (Silicon)
						</DownloadButton>
					</Platform>
					<Platform>
						<Box mb='15px'>
							<FontAwesomeIcon icon={faWindows} size='4x' />
						</Box>

						<DownloadButton href={downloads.windows!.downloadPath}>
							<Box as='span' mr='5px'>
								<FontAwesomeIcon icon={faDownload} color={textOnAction} />
							</Box>
							Download for Windows
						</DownloadButton>
					</Platform>
				</Grid>
			</Container>
		</Box>
	);
};

export default Downloader;
