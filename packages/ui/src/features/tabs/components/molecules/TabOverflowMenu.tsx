import type { TabItem } from '@beak/common/types/beak-project';
import { glassChakraProps } from '@beak/ui/lib/glass';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Button as ChakraButton, Flex, Menu, Portal } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { changeTab } from '../../store/actions';

interface TabOverflowMenuProps {
	clipped: TabItem[];
	onPick?: (tab: TabItem) => void;
}

const TabOverflowMenu: React.FC<TabOverflowMenuProps> = ({ clipped, onPick }) => {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree);
	const projectName = useAppSelector(s => s.global.project.name);
	const workflows = useAppSelector(s => s.global.workflows.workflows);

	if (clipped.length === 0) return null;

	function handlePick(tab: TabItem) {
		dispatch(changeTab(tab));
		onPick?.(tab);
	}

	return (
		<Menu.Root>
			<Menu.Trigger asChild>
				<ChakraButton
					type='button'
					aria-label={`Show ${clipped.length} hidden tab${clipped.length === 1 ? '' : 's'}`}
					title={`${clipped.length} hidden tab${clipped.length === 1 ? '' : 's'}`}
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					gap='1'
					h='24px'
					px='1.5'
					ml='1'
					mr='1'
					bg='transparent'
					border='none'
					borderRadius='sm'
					color='fg.muted'
					cursor='pointer'
					data-no-drag
					transition='color .12s ease, background-color .12s ease'
					_hover={{
						color: 'fg.default',
						bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
					}}
					_focusVisible={{
						outline: 'none',
						color: 'fg.default',
						boxShadow: 'inset 0 0 0 1px var(--beak-colors-accent-pink)',
					}}
				>
					<ChevronDown size={12} strokeWidth={2.2} />
					<Box as='span' fontSize='xs' fontWeight='600' lineHeight='1'>
						{clipped.length}
					</Box>
				</ChakraButton>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='220px' maxH='320px' overflowY='auto'>
						{clipped.map(tab => {
							const label = describeTab(tab, tree, workflows, projectName);
							return (
								<Menu.Item
									key={`${tab.type}:${String(tab.payload)}`}
									value={`${tab.type}:${String(tab.payload)}`}
									onClick={() => handlePick(tab)}
									fontSize='xs'
									fontWeight='500'
									borderRadius='sm'
									py='1.5'
									px='2'
									gap='2'
									color='fg.default'
									_hover={{
										bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
									}}
								>
									<Flex direction='column' gap='0' minW={0} flex='1'>
										<Box
											as='span'
											fontStyle={tab.temporary ? 'italic' : undefined}
											whiteSpace='nowrap'
											overflow='hidden'
											textOverflow='ellipsis'
										>
											{label.title}
										</Box>
										{label.subtitle && (
											<Box
												as='span'
												fontSize='10px'
												color='fg.muted'
												whiteSpace='nowrap'
												overflow='hidden'
												textOverflow='ellipsis'
											>
												{label.subtitle}
											</Box>
										)}
									</Flex>
								</Menu.Item>
							);
						})}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
};

function describeTab(
	tab: TabItem,
	tree: Record<string, { type: string; name?: string }>,
	workflows: Record<string, { name?: string }> | undefined,
	projectName: string | undefined,
): { title: string; subtitle?: string } {
	switch (tab.type) {
		case 'request': {
			const node = tree[tab.payload];
			return { title: node?.name ?? 'Request', subtitle: 'Request' };
		}
		case 'folder_overview': {
			const node = tree[tab.payload];
			return { title: node?.name ?? 'Folder', subtitle: 'Folder' };
		}
		case 'workflow_editor': {
			const wf = workflows?.[tab.payload];
			return { title: wf?.name ?? 'Workflow', subtitle: 'Workflow' };
		}
		case 'variable_set_editor':
			return { title: String(tab.payload), subtitle: 'Variable set' };
		case 'cookie_jar':
			return { title: 'Cookie jars' };
		case 'preferences':
			return { title: 'Preferences' };
		case 'new_project_intro':
			return { title: 'Getting started' };
		case 'project_home':
			return { title: projectName ?? 'Project home' };
		case 'variable_input_playground':
			return { title: 'Variable input lab' };
		default:
			return { title: 'Tab' };
	}
}

export default TabOverflowMenu;
