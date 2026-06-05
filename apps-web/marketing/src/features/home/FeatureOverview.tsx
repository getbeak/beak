import { Box, Heading, useToken } from '@chakra-ui/react';
import { faSuperpowers } from '@fortawesome/free-brands-svg-icons/faSuperpowers';
import { faFileCode } from '@fortawesome/free-regular-svg-icons/faFileCode';
import { faDiceD20 } from '@fortawesome/free-solid-svg-icons/faDiceD20';
import { faLanguage } from '@fortawesome/free-solid-svg-icons/faLanguage';
import { faPalette } from '@fortawesome/free-solid-svg-icons/faPalette';
import { faPeopleCarry } from '@fortawesome/free-solid-svg-icons/faPeopleCarry';
import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Card, CardBody, CardGrid, CardIcons, CardTitle } from '../../components/Card';
import Container from '../../components/Container';

interface CardItemProps {
	icon: FontAwesomeIconProps['icon'];
	title: React.ReactNode;
	body: React.ReactNode;
	color: string;
}

const CardItem: React.FC<CardItemProps> = ({ icon, title, body, color }) => (
	<Card>
		<CardIcons>
			<FontAwesomeIcon color={color} icon={icon} size='2x' />
		</CardIcons>
		<CardTitle>{title}</CardTitle>
		<CardBody>{body}</CardBody>
	</Card>
);

const FeatureOverview: React.FC = () => {
	const [primaryFill] = useToken('colors', ['primaryFill']);

	return (
		<Container>
			<Box as='section' py='25px'>
				<Heading as='h3' my='30px' mb='55px' textAlign='center' fontSize='30px' fontWeight={100}>
					{"The only API crafting tool you'd bring home to your mother"}
				</Heading>

				<CardGrid>
					<CardItem
						color={primaryFill}
						icon={faSuperpowers}
						title='Powerful feature set'
						body={
							'From support for large API projects, realtime values, rich value editors, to baked in project encryption, for your most secretive of secrets 🤫.'
						}
					/>
					<CardItem
						color={primaryFill}
						icon={faDiceD20}
						title='Realtime values'
						body={
							'Realtime values are inline variables you can insert into any part of your request that are calculated in real time as you type, and as you send requests.'
						}
					/>
					<CardItem
						color={primaryFill}
						icon={faPeopleCarry}
						title={
							<>
								<strong>Un</strong>-opinionated collaboration
							</>
						}
						body={
							'Instead of trying to guess how your team works, Beak projects are simple folder and file structures, so you can fit it into your existing Git workflow however you want.'
						}
					/>
					<CardItem
						color={primaryFill}
						icon={faPalette}
						title='Beautiful design language'
						body={
							'Taking insporation from popular existing tools, Beak will feel powerful yet familiar, so you can spend less time learning, and more time hacking.'
						}
					/>
					<CardItem
						color={primaryFill}
						icon={faFileCode}
						title='Comprehensive extensions API'
						body={
							'Coming soon, is an expansive extensions API, allowing you to create custom extensions for realtime values, API workflows, and more. Make Beak your own.'
						}
					/>
					<CardItem
						color={primaryFill}
						icon={faLanguage}
						title='Fully cross platform'
						body={"Wether you're on macOS, or Windows. Beak will look, work, and most importantly, feel the same."}
					/>
				</CardGrid>
			</Box>
		</Container>
	);
};

export default FeatureOverview;
