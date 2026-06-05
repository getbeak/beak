import Input from '@beak/ui/components/atoms/Input';
import Popover, { PopoverBody, PopoverFooter, PopoverHeader } from '@beak/ui/components/molecules/Popover';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Check, ChevronDown, GitBranch, Plus } from 'lucide-react';
import * as React from 'react';
import { useMemo, useRef, useState } from 'react';

interface BranchSwitcherProps {
	branch: string | undefined;
	branches: string[];
	dirty: boolean;
	disabled: boolean;
	onSwitch: (ref: string) => void;
	onCreate: (ref: string, opts: { checkout: boolean }) => void;
}

const ChakraButton = chakra('button');

/**
 * Branch picker for the source-control dialog. Click-to-open popover:
 *
 *   - Lists every local branch (current marked with a check).
 *   - Switch button per row — disabled when the working tree is dirty,
 *     with the reason surfaced inline.
 *   - "Create new branch" row at the bottom. Empty name disables submit;
 *     existing-branch name disables submit. The "and switch to it"
 *     toggle only fires the second checkout when not dirty.
 *
 * No merge / rebase here — those happen via the existing pull button, and
 * conflicts are resolved by hand in the user's terminal. This component
 * only manipulates HEAD pointers.
 */
const BranchSwitcher: React.FC<BranchSwitcherProps> = ({ branch, branches, dirty, disabled, onSwitch, onCreate }) => {
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const [open, setOpen] = useState(false);
	const [newName, setNewName] = useState('');
	const [checkoutAfterCreate, setCheckoutAfterCreate] = useState(true);

	const branchSet = useMemo(() => new Set(branches), [branches]);
	const sortedBranches = useMemo(() => [...branches].sort((a, b) => a.localeCompare(b)), [branches]);

	const trimmedNew = newName.trim();
	const nameAlreadyExists = trimmedNew.length > 0 && branchSet.has(trimmedNew);
	const canCreate = !disabled && trimmedNew.length > 0 && !nameAlreadyExists;
	const switchBlockedReason = dirty
		? 'Commit or discard your changes before switching branches.'
		: disabled
			? 'Another git operation is running…'
			: null;

	function handleSwitch(ref: string) {
		if (switchBlockedReason) return;
		if (ref === branch) return;
		onSwitch(ref);
		setOpen(false);
	}

	function handleCreate() {
		if (!canCreate) return;
		// If the working tree is dirty and the user asked to checkout-after-create,
		// silently downgrade to "create only" so we don't trip the block-on-dirty
		// rule mid-flow. The branch still gets made; the user can switch when clean.
		const safeCheckout = checkoutAfterCreate && !dirty;
		onCreate(trimmedNew, { checkout: safeCheckout });
		setNewName('');
		setOpen(false);
	}

	return (
		<React.Fragment>
			<ChakraButton
				ref={triggerRef}
				type='button'
				onClick={() => setOpen(o => !o)}
				display='inline-flex'
				alignItems='center'
				gap='2'
				h='auto'
				p='1.5'
				pr='2'
				borderRadius='md'
				borderWidth='1px'
				borderColor='transparent'
				bg='transparent'
				cursor='pointer'
				color='fg.default'
				transition='border-color .12s ease, background-color .12s ease'
				_hover={{
					borderColor: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 30%, transparent)',
					bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 6%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					borderColor: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 55%, transparent)',
				}}
			>
				<Flex
					align='center'
					justify='center'
					w='28px'
					h='28px'
					borderRadius='full'
					bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 28%, transparent)'
					color='accent.indigo'
					flexShrink={0}
				>
					<GitBranch size={13} strokeWidth={2.2} />
				</Flex>
				<Flex direction='column' align='flex-start' minW={0}>
					<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
						{'Branch'}
					</Box>
					<Flex align='center' gap='1.5'>
						<Box fontSize='sm' color='fg.default' fontWeight='600' fontFamily='mono'>
							{branch ?? '(detached)'}
						</Box>
						{branches.length > 1 && (
							<Box as='span' fontSize='10px' color='fg.muted' fontWeight='500'>
								{`+${branches.length - 1} other`}
							</Box>
						)}
					</Flex>
				</Flex>
				<Box color='fg.muted' display='inline-flex' alignItems='center'>
					<ChevronDown size={12} strokeWidth={2.2} />
				</Box>
			</ChakraButton>

			{open && triggerRef.current && (
				<Popover
					anchor={triggerRef.current}
					onClose={() => setOpen(false)}
					width={320}
					align='start'
					placement='bottom'
					tone='indigo'
					ariaLabel='Branches'
				>
					<PopoverHeader title={branch ? `On branch ${branch}` : 'Branches'} />
					<PopoverBody padding='4px'>
						{sortedBranches.length === 0 && (
							<Box px='3' py='4' fontSize='11.5px' color='fg.muted' textAlign='center'>
								{'No branches yet — create the first one below.'}
							</Box>
						)}
						{sortedBranches.map(name => {
							const current = name === branch;
							const disabledRow = !current && Boolean(switchBlockedReason);
							return (
								<ChakraButton
									key={name}
									type='button'
									onClick={() => handleSwitch(name)}
									disabled={disabledRow || current}
									display='flex'
									alignItems='center'
									gap='2'
									w='100%'
									h='28px'
									px='2'
									borderRadius='sm'
									border='none'
									background={current ? 'color-mix(in srgb, var(--beak-colors-accent-indigo) 12%, transparent)' : 'transparent'}
									cursor={current || disabledRow ? 'default' : 'pointer'}
									color={current ? 'fg.default' : disabledRow ? 'fg.disabled' : 'fg.default'}
									fontSize='12px'
									fontFamily='mono'
									fontWeight={current ? '700' : '500'}
									textAlign='left'
									_hover={
										current || disabledRow
											? undefined
											: { background: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)' }
									}
								>
									<Box w='12px' display='inline-flex' alignItems='center' justifyContent='center' color='accent.indigo'>
										{current && <Check size={11} strokeWidth={2.4} />}
									</Box>
									<Box flex='1 1 auto' minW={0} overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
										{name}
									</Box>
									{current && (
										<Box
											as='span'
											fontSize='9.5px'
											fontFamily='inherit'
											fontWeight='700'
											letterSpacing='0.04em'
											textTransform='uppercase'
											color='fg.subtle'
										>
											{'current'}
										</Box>
									)}
								</ChakraButton>
							);
						})}
					</PopoverBody>
					<PopoverFooter
						leading={
							<Flex direction='column' gap='1' minW={0}>
								<Box fontSize='9.5px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
									{'Create new branch'}
								</Box>
								<Input
									$beakSize='sm'
									value={newName}
									placeholder={branch ? `from ${branch}` : 'branch name'}
									onChange={e => setNewName(e.currentTarget.value)}
									onKeyDown={e => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleCreate();
										}
									}}
								/>
								<Flex align='center' gap='2' fontSize='10.5px' color='fg.muted'>
									<chakra.label display='inline-flex' alignItems='center' gap='1' cursor='pointer'>
										<chakra.input
											type='checkbox'
											checked={checkoutAfterCreate}
											onChange={e => setCheckoutAfterCreate(e.currentTarget.checked)}
											m={0}
										/>
										<Box as='span'>{'switch to it'}</Box>
									</chakra.label>
									{nameAlreadyExists && (
										<Box as='span' color='accent.alert'>
											{'name exists'}
										</Box>
									)}
								</Flex>
								{switchBlockedReason && (
									<Box fontSize='10.5px' color='accent.warning' lineHeight='1.35'>
										{switchBlockedReason}
									</Box>
								)}
							</Flex>
						}
					>
						<ChakraButton
							type='button'
							onClick={handleCreate}
							disabled={!canCreate}
							display='inline-flex'
							alignItems='center'
							gap='1'
							h='26px'
							px='2.5'
							borderRadius='sm'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 38%, transparent)'
							bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 16%, transparent)'
							color='accent.indigo'
							fontSize='11px'
							fontWeight='700'
							letterSpacing='0.02em'
							textTransform='uppercase'
							cursor={canCreate ? 'pointer' : 'default'}
							opacity={canCreate ? 1 : 0.5}
							transition='filter .12s ease'
							_hover={canCreate ? { filter: 'brightness(1.1)' } : undefined}
						>
							<Plus size={10} strokeWidth={2.4} />
							<Box as='span'>{'Create'}</Box>
						</ChakraButton>
					</PopoverFooter>
				</Popover>
			)}
		</React.Fragment>
	);
};

export default BranchSwitcher;
