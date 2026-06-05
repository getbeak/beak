import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { Box, Button, chakra, Flex, Text } from '@chakra-ui/react';
import type { EntryMap } from '@getbeak/types/body-editor-json';
import { Braces, Check, Copy } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';

import { entryMapToJsonSchema } from '../to-json-schema';

interface JsonSchemaViewDialogProps {
	entries: EntryMap;
	onClose: () => void;
}

const Pre = chakra('pre');

/**
 * Read-only view of the JSON Schema generated from the current EntryMap.
 * Lets the user copy a Draft 2020-12 schema doc out for OpenAPI specs,
 * external tooling, or just to verify Beak's emit matches their expectations.
 * Pair with the "Paste schema" import flow for a round-trip.
 */
const JsonSchemaViewDialog: React.FC<JsonSchemaViewDialogProps> = ({ entries, onClose }) => {
	const schema = useMemo(() => entryMapToJsonSchema(entries, { includeSchemaDialect: true }), [entries]);
	const json = useMemo(() => (schema ? JSON.stringify(schema, null, 2) : ''), [schema]);
	const [copied, setCopied] = useState(false);

	async function copy() {
		if (!json) return;
		try {
			await navigator.clipboard.writeText(json);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1400);
		} catch {
			// Clipboard write can fail when the document isn't focused; fall back
			// to selecting the text so the user can copy manually.
			setCopied(false);
		}
	}

	return (
		<Dialog onClose={onClose} size='lg' tone='indigo'>
			<DialogHeader
				icon={<Braces size={14} strokeWidth={1.8} />}
				title='JSON Schema'
				description='Draft 2020-12 schema generated from the current body. Paste it into an OpenAPI spec, share it with a teammate, or feed it to a validator.'
			/>
			<DialogBody padding='12px 20px 16px'>
				{!schema && (
					<Flex
						direction='column'
						align='center'
						justify='center'
						minH='180px'
						gap='2'
						color='fg.subtle'
						borderWidth='1px'
						borderRadius='sm'
						borderStyle='dashed'
						borderColor='border.subtle'
						p='4'
					>
						<Braces size={18} strokeWidth={1.6} />
						<Text fontSize='xs'>{'No body fields yet — add some to generate a schema.'}</Text>
					</Flex>
				)}
				{schema && (
					<Box position='relative'>
						<Pre
							w='100%'
							maxH='340px'
							overflow='auto'
							p='2.5'
							bg='bg.canvas'
							borderWidth='1px'
							borderColor='border.subtle'
							borderRadius='sm'
							color='fg.default'
							fontFamily='mono'
							fontSize='11.5px'
							lineHeight='1.55'
							whiteSpace='pre'
							css={{ userSelect: 'text' }}
						>
							{json}
						</Pre>
					</Box>
				)}
			</DialogBody>
			<DialogFooter>
				<Button size='sm' variant='ghost' onClick={onClose}>
					{'Close'}
				</Button>
				<Button
					size='sm'
					colorPalette='indigo'
					disabled={!schema}
					onClick={copy}
					bg={schema ? 'accent.indigo' : 'color-mix(in srgb, var(--beak-colors-accent-indigo) 40%, transparent)'}
					color='fg.onAccent'
					_hover={schema ? { bg: 'accent.indigo', filter: 'brightness(1.08)' } : undefined}
				>
					<Flex align='center' gap='1.5'>
						{copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={2} />}
						<Box as='span'>{copied ? 'Copied' : 'Copy'}</Box>
					</Flex>
				</Button>
			</DialogFooter>
		</Dialog>
	);
};

export default JsonSchemaViewDialog;
