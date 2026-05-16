import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { requestBodyJsonEditorReplacePayload } from '@beak/ui/store/project/actions';
import { Box, Button, chakra, Flex, Text } from '@chakra-ui/react';
import { AlertTriangle, Braces, FileJson } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { JsonSchemaParseError, parseAndConvert } from '../converter';

interface JsonSchemaImportDialogProps {
	requestId: string;
	onClose: () => void;
	/**
	 * If true, the importer warns the user that applying will discard the
	 * current body. Used when the JSON editor already has entries.
	 */
	hasExistingEntries: boolean;
}

const Textarea = chakra('textarea');

/**
 * Paste-a-schema modal: user drops a JSON Schema (Draft 4 → 2020-12, or an
 * OpenAPI schema fragment) into the textarea, we parse on the fly and show
 * any warnings, and on apply we replace the request's JSON body with the
 * converted entries. Discard-of-existing is gated behind a confirm — the
 * user just edited those entries, so swapping silently would be rude.
 */
const JsonSchemaImportDialog: React.FC<JsonSchemaImportDialogProps> = ({ requestId, onClose, hasExistingEntries }) => {
	const dispatch = useDispatch();
	const [raw, setRaw] = useState('');

	// Convert eagerly so the user sees an error / warning preview while typing.
	// Empty input is not an error — just keep the preview suppressed.
	const preview = useMemo(() => {
		if (raw.trim().length === 0) return null;
		try {
			const result = parseAndConvert(raw);
			return { ok: true as const, ...result };
		} catch (err) {
			const message =
				err instanceof JsonSchemaParseError ? err.message : err instanceof Error ? err.message : 'Failed to parse schema.';
			return { ok: false as const, message };
		}
	}, [raw]);

	const canApply = preview?.ok === true && Object.keys(preview.entries).length > 0;

	function apply() {
		if (!preview?.ok) return;
		dispatch(requestBodyJsonEditorReplacePayload({ requestId, payload: preview.entries }));
		onClose();
	}

	return (
		<Dialog onClose={onClose} size='lg' tone='indigo'>
			<DialogHeader
				icon={<FileJson size={14} strokeWidth={1.8} />}
				title='Import JSON Schema'
				description='Paste a JSON Schema (Draft 4 – 2020-12) or an OpenAPI schema fragment. We seed the editor with the described structure — fields, types, required flags, and defaults.'
			/>
			<DialogBody padding='12px 20px 16px'>
				<Box position='relative'>
					<Textarea
						value={raw}
						onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setRaw(event.currentTarget.value)}
						placeholder={
							'{\n  "type": "object",\n  "properties": {\n    "id": { "type": "string" }\n  },\n  "required": ["id"]\n}'
						}
						spellCheck={false}
						w='100%'
						h='260px'
						p='2'
						bg='bg.canvas'
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='sm'
						color='fg.default'
						fontFamily='mono'
						fontSize='12px'
						lineHeight='1.45'
						css={{
							resize: 'vertical',
							caretColor: 'var(--beak-colors-accent-pink)',
							'&::placeholder': { color: 'var(--beak-colors-fg-subtle)', whiteSpace: 'pre' },
							'&:focus': {
								outline: 'none',
								borderColor: 'var(--beak-colors-accent-pink)',
								boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
							},
						}}
					/>
				</Box>

				{preview && (
					<Flex
						mt='3'
						direction='column'
						gap='1.5'
						p='2.5'
						borderWidth='1px'
						borderRadius='sm'
						bg={preview.ok ? 'bg.canvas' : 'color-mix(in srgb, var(--beak-colors-accent-alert) 7%, transparent)'}
						borderColor={
							preview.ok ? 'border.subtle' : 'color-mix(in srgb, var(--beak-colors-accent-alert) 35%, transparent)'
						}
					>
						{!preview.ok && (
							<Flex align='center' gap='2' color='accent.alert'>
								<AlertTriangle size={14} strokeWidth={2} />
								<Text fontSize='xs' fontWeight='600'>
									{preview.message}
								</Text>
							</Flex>
						)}
						{preview.ok && (
							<Flex align='center' gap='2'>
								<Braces size={14} strokeWidth={2} color='var(--beak-colors-accent-indigo)' />
								<Text fontSize='xs' fontWeight='600' color='fg.default'>
									{`${Object.keys(preview.entries).length} ${
										Object.keys(preview.entries).length === 1 ? 'entry' : 'entries'
									} ready`}
								</Text>
							</Flex>
						)}
						{preview.ok && preview.warnings.length > 0 && (
							<Box pl='6' fontSize='11px' color='fg.muted' lineHeight='1.55'>
								{preview.warnings.map(w => (
									<Box key={w} as='span' display='block'>
										{`• ${w}`}
									</Box>
								))}
							</Box>
						)}
					</Flex>
				)}

				{hasExistingEntries && (
					<Flex
						mt='3'
						align='flex-start'
						gap='2'
						p='2.5'
						borderWidth='1px'
						borderRadius='sm'
						bg='color-mix(in srgb, var(--beak-colors-accent-warning) 7%, transparent)'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 30%, transparent)'
					>
						<AlertTriangle size={14} strokeWidth={2} color='var(--beak-colors-accent-warning)' />
						<Text fontSize='xs' color='fg.muted' lineHeight='1.55'>
							{'This will replace the current JSON body. Existing entries will be discarded.'}
						</Text>
					</Flex>
				)}
			</DialogBody>
			<DialogFooter>
				<Button size='sm' variant='ghost' onClick={onClose}>
					{'Cancel'}
				</Button>
				<Button
					size='sm'
					colorPalette='pink'
					disabled={!canApply}
					onClick={apply}
					bg={canApply ? 'accent.pink' : 'color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent)'}
					color='fg.onAccent'
					_hover={canApply ? { bg: 'accent.pink', filter: 'brightness(1.08)' } : undefined}
				>
					{'Apply schema'}
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default JsonSchemaImportDialog;
