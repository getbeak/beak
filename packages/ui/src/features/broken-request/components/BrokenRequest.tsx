import { BeakError } from '@beak/common/utils/squawk';
import { type CollectionFile, requestFileOverrideSchema, requestFileSchema, toJsonSchema } from '@beak/state/schemas';
import Button from '@beak/ui/components/atoms/Button';
import EditorView from '@beak/ui/components/atoms/EditorView';
import { loadCollectionForRequest } from '@beak/ui/lib/beak-project/collection';
import { ipcExplorerService, ipcFsService } from '@beak/ui/lib/ipc';
import { Box, Flex } from '@chakra-ui/react';
import type { RequestNode } from '@getbeak/types/nodes';
import { Check, FileWarning, Save } from 'lucide-react';
import * as monaco from 'monaco-editor';
import path from 'path-browserify';
import React, { useEffect, useMemo, useState } from 'react';

interface BrokenRequestProps {
	filePath: string;
	node: RequestNode;
	onDismiss: () => void;
	/**
	 * When true, the user can leave the raw editor at any time (used for the
	 * voluntary "Edit raw" toggle on a valid request). When false, dismiss is
	 * only offered once the file passes validation again — leaving while the
	 * file is broken would drop the user into a request view that crashes on
	 * the failed node.
	 */
	allowDismissAnytime?: boolean;
}

const SCHEMA_URI = 'inmemory://schemas/beak-request.schema.json';
const OVERRIDE_SCHEMA_URI = 'inmemory://schemas/beak-request-override.schema.json';

function buildModelUri(filePath: string) {
	const safe = filePath.replace(/[^a-zA-Z0-9_./-]/g, '_');
	return `inmemory://broken-request${safe.startsWith('/') ? safe : `/${safe}`}`;
}

/**
 * Register the request JSON schemas with Monaco's JSON language service so
 * the editor highlights validation errors inline. Idempotent — re-registering
 * the same URI just replaces the previous entry.
 */
function registerRequestSchemas(modelUri: string, useOverrideSchema: boolean) {
	const existing = monaco.json.jsonDefaults.diagnosticsOptions.schemas ?? [];
	const next: monaco.json.DiagnosticsOptions['schemas'] = existing.filter(
		s => s.uri !== SCHEMA_URI && s.uri !== OVERRIDE_SCHEMA_URI,
	);

	next.push({
		uri: SCHEMA_URI,
		fileMatch: useOverrideSchema ? [] : [modelUri],
		schema: toJsonSchema(requestFileSchema) as object,
	});
	next.push({
		uri: OVERRIDE_SCHEMA_URI,
		fileMatch: useOverrideSchema ? [modelUri] : [],
		schema: toJsonSchema(requestFileOverrideSchema) as object,
	});

	monaco.json.jsonDefaults.setDiagnosticsOptions({
		validate: true,
		allowComments: false,
		enableSchemaRequest: false,
		schemas: next,
	});
}

function hasNonEmptyDefaults(collection: CollectionFile | null) {
	const defaults = collection?.defaults;
	return Boolean(defaults && typeof defaults === 'object' && Object.keys(defaults).length > 0);
}

const BrokenRequest: React.FC<React.PropsWithChildren<BrokenRequestProps>> = ({
	filePath,
	node,
	onDismiss,
	allowDismissAnytime = false,
}) => {
	const [text, setText] = useState<string | null>(null);
	const [savedText, setSavedText] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [useOverrideSchema, setUseOverrideSchema] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const [raw, collection] = await Promise.all([
					ipcFsService.readText(filePath),
					loadCollectionForRequest(filePath).catch(() => null),
				]);
				if (cancelled) return;
				setUseOverrideSchema(hasNonEmptyDefaults(collection));
				setText(raw);
				setSavedText(raw);
			} catch (err) {
				if (cancelled) return;
				setLoadError(err instanceof Error ? err.message : String(err));
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [filePath]);

	const modelUri = useMemo(() => buildModelUri(filePath), [filePath]);

	useEffect(() => {
		registerRequestSchemas(modelUri, useOverrideSchema);
	}, [modelUri, useOverrideSchema]);

	const dirty = text !== null && savedText !== null && text !== savedText;
	const isCurrentlyValid = node.mode === 'valid';
	const fileName = path.basename(filePath);
	// In broken/sticky mode we only let the user leave once the file passes
	// validation again. In voluntary raw-edit mode the user can leave any time.
	const showSuccessBanner = !allowDismissAnytime && isCurrentlyValid;

	// Field errors come from the redux node when it's still in failed mode;
	// after a successful save the node flips to valid and there's nothing to
	// list — the success banner takes over.
	const fieldEntries: [string, string][] = (() => {
		if (node.mode !== 'failed') return [];
		const handled = BeakError.coerce(node.error);
		const serialised = handled.serialize();
		const fieldErrors = (serialised.meta?.fieldErrors ?? {}) as Record<string, string>;
		return Object.entries(fieldErrors);
	})();

	async function handleSave() {
		if (text === null || saving) return;
		setSaving(true);
		setSaveError(null);
		try {
			await ipcFsService.writeText(filePath, text);
			setSavedText(text);
			// The fs watcher picks the change up and re-validates; if the file
			// is now valid the redux node mode flips to 'valid' and the success
			// banner renders. The user stays here until they click "Open as
			// request".
		} catch (err) {
			setSaveError(err instanceof Error ? err.message : String(err));
		} finally {
			setSaving(false);
		}
	}

	return (
		<Flex direction='column' h='100%' bg='bg.canvas' overflow='hidden'>
			<Flex align='center' gap='3' px='4' py='2.5' borderBottomWidth='1px' borderColor='border.subtle' bg='bg.surface'>
				<Flex
					align='center'
					justify='center'
					w='22px'
					h='22px'
					borderRadius='full'
					bg={
						isCurrentlyValid
							? 'color-mix(in srgb, var(--beak-colors-accent-success) 18%, transparent)'
							: 'color-mix(in srgb, var(--beak-colors-accent-alert) 18%, transparent)'
					}
					color={isCurrentlyValid ? 'accent.success' : 'accent.alert'}
					flex='0 0 auto'
				>
					{isCurrentlyValid ? <Check size={13} strokeWidth={2.4} /> : <FileWarning size={13} strokeWidth={2.2} />}
				</Flex>
				<Flex direction='column' flex='1 1 auto' minW={0}>
					<Box fontSize='sm' fontWeight='600' color='fg.default' lineHeight='1.2'>
						{isCurrentlyValid ? 'File is valid' : 'Request file validation failed'}
					</Box>
					<Box
						fontSize='xs'
						color='fg.muted'
						fontFamily='mono'
						overflow='hidden'
						textOverflow='ellipsis'
						whiteSpace='nowrap'
					>
						{fileName}
						{dirty && (
							<Box as='span' ml='2' color='accent.warning' fontWeight='600'>
								{'• unsaved'}
							</Box>
						)}
					</Box>
				</Flex>

				<Button onClick={() => ipcExplorerService.revealFile(filePath)}>{'Reveal in Finder'}</Button>

				<Button onClick={handleSave} disabled={!dirty || saving}>
					<Flex align='center' gap='1.5'>
						<Save size={12} strokeWidth={2.2} />
						{saving ? 'Saving…' : 'Save'}
					</Flex>
				</Button>

				{allowDismissAnytime && <Button onClick={onDismiss}>{dirty ? 'Done (discard changes)' : 'Done'}</Button>}
			</Flex>

			{showSuccessBanner && (
				<Flex
					align='center'
					gap='3'
					px='4'
					py='2'
					bg='color-mix(in srgb, var(--beak-colors-accent-success) 10%, transparent)'
					borderBottomWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-success) 28%, var(--beak-colors-border-subtle))'
				>
					<Box fontSize='xs' color='fg.default' flex='1 1 auto'>
						{'Looks good — the file matches the request schema. You can stay here for more edits or open it as a request.'}
					</Box>
					<Button onClick={onDismiss}>{'Open as request'}</Button>
				</Flex>
			)}

			{saveError && (
				<Flex
					align='center'
					gap='2'
					px='4'
					py='2'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 12%, transparent)'
					borderBottomWidth='1px'
					borderColor='border.subtle'
					color='accent.alert'
					fontSize='xs'
				>
					<Box fontWeight='600'>{'Save failed:'}</Box>
					<Box color='fg.default' fontFamily='mono'>
						{saveError}
					</Box>
				</Flex>
			)}

			<Box flex='1 1 auto' minH='0' position='relative'>
				{text !== null && (
					<EditorView
						language='json'
						value={text}
						path={modelUri}
						onChange={value => setText(value ?? '')}
						options={{
							readOnly: false,
							lineNumbers: 'on',
							renderValidationDecorations: 'on',
						}}
					/>
				)}
				{text === null && !loadError && (
					<Flex h='100%' align='center' justify='center' color='fg.subtle' fontSize='xs'>
						{'Loading file…'}
					</Flex>
				)}
				{loadError && (
					<Flex
						h='100%'
						align='center'
						justify='center'
						direction='column'
						gap='1'
						color='fg.muted'
						fontSize='xs'
						px='4'
						textAlign='center'
					>
						<Box color='accent.alert' fontWeight='600'>
							{'Could not read file'}
						</Box>
						<Box fontFamily='mono'>{loadError}</Box>
					</Flex>
				)}
			</Box>

			{fieldEntries.length > 0 && (
				<Box maxH='180px' overflowY='auto' borderTopWidth='1px' borderColor='border.subtle' bg='bg.surface' px='4' py='2'>
					<Box
						fontSize='10px'
						fontWeight='700'
						color='accent.alert'
						textTransform='uppercase'
						letterSpacing='0.06em'
						mb='1.5'
					>
						{`${fieldEntries.length} validation ${fieldEntries.length === 1 ? 'issue' : 'issues'}`}
					</Box>
					<Flex direction='column' gap='1'>
						{fieldEntries.map(([fieldPath, msg]) => (
							<Flex key={fieldPath} align='flex-start' gap='2' fontSize='xs' fontFamily='mono'>
								<Box
									flex='0 0 auto'
									color='accent.pink'
									fontWeight='600'
									minW='140px'
									maxW='260px'
									overflow='hidden'
									textOverflow='ellipsis'
									whiteSpace='nowrap'
								>
									{fieldPath || '(root)'}
								</Box>
								<Box color='fg.default' wordBreak='break-word'>
									{msg}
								</Box>
							</Flex>
						))}
					</Flex>
				</Box>
			)}
		</Flex>
	);
};

export default BrokenRequest;
