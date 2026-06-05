import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { SearchX, Sparkles } from 'lucide-react';
import * as React from 'react';

const MotionBox = motion.create(Box);

export interface OmniEmptyProps {
	hasQuery: boolean;
	scope: 'all' | 'commands' | 'recents' | 'workflows';
}

const OmniEmpty: React.FC<OmniEmptyProps> = ({ hasQuery, scope }) => {
	if (!hasQuery)
		return (
			<MotionBox
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
				py='5'
				px='3'
			>
				<Flex direction='column' gap='2.5' color='fg.subtle'>
					<Flex align='center' gap='2' color='fg.muted'>
						<Sparkles size={14} />
						<Box fontSize='xs' fontWeight='600' letterSpacing='-0.005em'>
							{scope === 'commands'
							? 'Run a command'
							: scope === 'recents'
								? 'Browse recents'
								: scope === 'workflows'
									? 'Find a workflow'
									: 'Search the project'}
						</Box>
					</Flex>
					<Box fontSize='11.5px' lineHeight='1.55' color='fg.subtle'>
						{scope === 'all' && (
							<>
								{'Find requests, folders, variable sets, workflows, pages, and tabs. '}
								<Box as='span' color='accent.success' fontWeight='600'>
									{'Type > '}
								</Box>
								{'for commands, '}
								<Box as='span' color='accent.indigo' fontWeight='600'>
									{'~ '}
								</Box>
								{'for recents, '}
								<Box as='span' color='accent.pink' fontWeight='600'>
									{'# '}
								</Box>
								{'for workflows.'}
							</>
						)}
						{scope === 'commands' && 'Type to filter actions, theme switches, tab controls.'}
						{scope === 'recents' && 'Currently open and recently viewed surfaces.'}
						{scope === 'workflows' && (
							<>
								{'Match by workflow name, description, tag, or id. '}
								<Box as='span' color='accent.pink' fontWeight='600'>
									{'⌘ ⇧ O '}
								</Box>
								{'jumps back here from anywhere.'}
							</>
						)}
					</Box>
				</Flex>
			</MotionBox>
		);

	return (
		<Flex direction='column' align='center' justify='center' gap='2.5' py='8' color='fg.subtle'>
			<Flex
				align='center'
				justify='center'
				w='44px'
				h='44px'
				borderRadius='full'
				bg='bg.subtle'
				borderWidth='1px'
				borderColor='border.subtle'
				color='fg.subtle'
			>
				<SearchX size={20} strokeWidth={1.8} />
			</Flex>
			<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
				{'Nothing matches that query'}
			</Box>
			<Box fontSize='10px' color='accent.pink' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
				{'Try a different search'}
			</Box>
		</Flex>
	);
};

export default OmniEmpty;
