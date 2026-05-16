import BeakTooltip from '@beak/ui/components/atoms/BeakTooltip';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import { ArrowUpRight, Check, Filter, type LucideIcon, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';

export type ExplorerFilter = 'all' | 'requests' | 'workflows';

interface ExplorerFilterMenuProps {
	value: ExplorerFilter;
	onChange: (next: ExplorerFilter) => void;
}

interface FilterOption {
	value: ExplorerFilter;
	label: string;
	Icon: LucideIcon;
}

const OPTIONS: FilterOption[] = [
	{ value: 'all', label: 'Show everything', Icon: Filter },
	{ value: 'requests', label: 'Show only requests', Icon: ArrowUpRight },
	{ value: 'workflows', label: 'Show only workflows', Icon: WorkflowIcon },
];

const ChakraButton = chakra('button');

/**
 * Tree filter for the project explorer. When set to anything other than
 * `all`, the trigger advertises its active state via colour and an explicit
 * label — the user mustn't forget the filter is on, otherwise they'll panic
 * thinking files have disappeared.
 */
const ExplorerFilterMenu: React.FC<ExplorerFilterMenuProps> = ({ value, onChange }) => {
	const isActive = value !== 'all';
	const activeOption = OPTIONS.find(o => o.value === value) ?? OPTIONS[0];

	return (
		<Menu.Root>
			<BeakTooltip content={isActive ? `Filter: ${activeOption.label}` : 'Filter the explorer'}>
				<Menu.Trigger asChild>
					<ChakraButton
						type='button'
						aria-label='Filter explorer'
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						gap='1'
						h='18px'
						px={isActive ? '1.5' : '0'}
						w={isActive ? 'auto' : '18px'}
						bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-indigo) 16%, transparent)' : 'transparent'}
						border='none'
						borderRadius='sm'
						color={isActive ? 'accent.indigo' : 'fg.subtle'}
						fontSize='10px'
						fontWeight='600'
						letterSpacing='0.04em'
						textTransform='uppercase'
						cursor='pointer'
						transition='color .1s linear, background-color .1s linear'
						onClick={event => event.stopPropagation()}
						_hover={{
							color: isActive ? 'accent.indigo' : 'fg.default',
							bg: isActive
								? 'color-mix(in srgb, var(--beak-colors-accent-indigo) 22%, transparent)'
								: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							color: 'fg.default',
							boxShadow: 'inset 0 0 0 1px var(--beak-colors-accent-pink)',
						}}
						css={{
							'&[data-state="open"]': {
								color: 'var(--beak-colors-accent-indigo)',
								background: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 22%, transparent)',
							},
						}}
					>
						<activeOption.Icon size={12} strokeWidth={1.8} />
						{isActive && (
							<Box as='span' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
								{value === 'requests' ? 'Requests' : 'Workflows'}
							</Box>
						)}
					</ChakraButton>
				</Menu.Trigger>
			</BeakTooltip>
			<Portal>
				<Menu.Positioner>
					<Menu.Content
						bg='bg.surface.emphasized'
						borderWidth='1px'
						borderColor='border.default'
						borderRadius='md'
						boxShadow='0 8px 24px rgba(0,0,0,0.28)'
						p='1'
						minW='200px'
					>
						{OPTIONS.map(opt => {
							const selected = opt.value === value;
							return (
								<Menu.Item
									key={opt.value}
									value={opt.value}
									onClick={(event: React.MouseEvent) => {
										event.stopPropagation();
										onChange(opt.value);
									}}
									fontSize='12px'
									fontWeight={selected ? '600' : '500'}
									borderRadius='sm'
									py='1.5'
									px='2'
									gap='2'
									bg={selected ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : undefined}
									color={selected ? 'accent.pink' : 'fg.default'}
									_hover={{
										bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
									}}
								>
									<Flex
										align='center'
										justify='center'
										w='12px'
										h='12px'
										flex='0 0 auto'
										color={selected ? 'accent.pink' : 'transparent'}
									>
										<Check size={11} strokeWidth={3} />
									</Flex>
									<Flex
										align='center'
										justify='center'
										w='14px'
										h='14px'
										flex='0 0 auto'
										color={selected ? 'accent.pink' : 'fg.subtle'}
									>
										<opt.Icon size={12} strokeWidth={1.8} />
									</Flex>
									<Box as='span' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
										{opt.label}
									</Box>
								</Menu.Item>
							);
						})}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
};

export default ExplorerFilterMenu;
