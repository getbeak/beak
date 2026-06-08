import { instantiateTemplate, templateCatalog, type TemplateKey, workflowStats } from '@beak/state/workflows';
import { Box, Button, Dialog, Flex, Stack } from '@chakra-ui/react';
import { Bell, GitBranch, LayoutTemplate, Repeat, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';

interface TemplatePickerDialogProps {
	open: boolean;
	onClose: () => void;
	onPick: (template: TemplateKey) => void;
}

/**
 * Modal picker for the workflow starter templates. Reads `templateCatalog`
 * from `@beak/state/workflows` so the catalog is the source of truth — add
 * a template to the helper, it shows up here.
 *
 * Icons stay local because lucide-react lives in the renderer, and the
 * mapping from template key → icon is renderer policy (which icon set is
 * "current" can change without touching state code).
 */
const TemplatePickerDialog: React.FC<TemplatePickerDialogProps> = ({ open, onClose, onPick }) => {
	function pick(template: TemplateKey) {
		onPick(template);
		onClose();
	}

	return (
		<Dialog.Root open={open} onOpenChange={d => (d.open ? null : onClose())} size='md' placement='center'>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>{'New workflow'}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						<Box mb='3' fontSize='12px' color='fg.muted'>
							{'Pick a starter shape — you can rewire and rename everything afterwards.'}
						</Box>
						<Stack gap='1.5'>
							{templateCatalog.map(item => {
								const icon = iconFor(item.key);
								const previewStats = templateStatsPreview(item.key);
								return (
									<Flex
										as='button'
										key={item.key}
										role='button'
										align='flex-start'
										gap='3'
										px='3'
										py='2.5'
										textAlign='left'
										borderRadius='md'
										borderWidth='1px'
										borderColor='border.subtle'
										bg='bg.surface'
										cursor='pointer'
										_hover={{ borderColor: 'accent.pink', bg: 'bg.subtle' }}
										onClick={() => pick(item.key)}
									>
										<Flex
											align='center'
											justify='center'
											w='28px'
											h='28px'
											flexShrink={0}
											borderRadius='sm'
											color='accent.pink'
											bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
										>
											{icon}
										</Flex>
										<Stack gap='0.5' flex='1' minW={0}>
											<Flex align='center' gap='2'>
												<Box fontSize='13px' fontWeight='600' color='fg.default'>
													{item.title}
												</Box>
												{previewStats && (
													<Box fontSize='10px' color='fg.muted' fontVariantNumeric='tabular-nums' fontFamily='mono'>
														{previewStats}
													</Box>
												)}
											</Flex>
											<Box fontSize='11px' color='fg.subtle' lineHeight='1.4'>
												{item.subtitle}
											</Box>
										</Stack>
									</Flex>
								);
							})}
						</Stack>
					</Dialog.Body>
					<Dialog.Footer>
						<Button variant='ghost' size='sm' onClick={onClose}>
							{'Cancel'}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
};

/**
 * Build a tiny "1·1·0" stats glyph for each template — request/loop/
 * notification counts of the seed. Lets the user pick by shape rather
 * than by name alone. Counter-minter is deterministic so each call
 * produces the same numbers.
 */
function templateStatsPreview(key: TemplateKey): string | null {
	const counts: Record<string, number> = {};
	const mintId = (prefix: 'workflow' | 'node' | 'edge') => {
		counts[prefix] = (counts[prefix] ?? 0) + 1;
		return `${prefix}-${counts[prefix]}`;
	};
	try {
		const wf = instantiateTemplate({ template: key, name: '', mintId });
		const stats = workflowStats(wf);
		const interesting = stats.nodesByKind.request + stats.nodesByKind.loop + stats.nodesByKind.notification;
		if (interesting === 0) return null;
		const parts: string[] = [];
		if (stats.nodesByKind.request) parts.push(`${stats.nodesByKind.request} req`);
		if (stats.nodesByKind.loop) parts.push(`${stats.nodesByKind.loop} loop`);
		if (stats.nodesByKind.notification) parts.push(`${stats.nodesByKind.notification} notif`);
		return parts.join(' · ');
	} catch {
		return null;
	}
}

function iconFor(template: TemplateKey): React.ReactNode {
	switch (template) {
		case 'blank':
			return <WorkflowIcon size={14} strokeWidth={1.8} />;
		case 'smoke-test':
			return <Bell size={14} strokeWidth={1.8} />;
		case 'auth-chain':
			return <GitBranch size={14} strokeWidth={1.8} />;
		case 'paginated-fetch':
			return <Repeat size={14} strokeWidth={1.8} />;
		default:
			return <LayoutTemplate size={14} strokeWidth={1.8} />;
	}
}

export default TemplatePickerDialog;
