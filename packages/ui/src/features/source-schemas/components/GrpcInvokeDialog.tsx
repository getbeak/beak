import type { GrpcMethodDescriptor, GrpcServiceDescriptor, InvokeUnaryRes } from '@beak/common/ipc/grpc';
import type { GrpcDescriptor } from '@beak/state/schemas';
import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { ipcGrpcService } from '@beak/ui/lib/ipc';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { AlertOctagon, ChevronDown, Network, Play, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';

const ChakraTextarea = chakra('textarea');
const ChakraSelect = chakra('select');

export interface GrpcInvokeDialogProps {
	endpoint: string;
	descriptor: GrpcDescriptor;
	services: GrpcServiceDescriptor[];
	/** When provided, the dialog starts focused on this method. */
	initialSelection?: { service: string; method: string };
	onClose: () => void;
}

interface RpcSelection {
	service: GrpcServiceDescriptor;
	method: GrpcMethodDescriptor;
}

/**
 * Minimal "try a gRPC method" surface. Picks a service+method from the
 * discovered descriptor list, lets the user edit the request as JSON, hits
 * `ipcGrpcService.invokeUnary`, and renders the response. Streaming methods
 * are filtered out of the picker because we only wire unary so far — the
 * host rejects them with a clear message anyway, but offering them here
 * would be a UX trap.
 *
 * This is intentionally not the final request editor. It exists so that
 * once Discover succeeds the user can prove the round-trip works without
 * waiting for the gRPC body editor + tab integration to land.
 */
const GrpcInvokeDialog: React.FC<GrpcInvokeDialogProps> = ({
	endpoint,
	descriptor,
	services,
	initialSelection,
	onClose,
}) => {
	const unaryMethods = useMemo(() => {
		const out: RpcSelection[] = [];
		for (const svc of services) {
			for (const method of svc.methods) {
				if (!method.requestStream && !method.responseStream) out.push({ service: svc, method });
			}
		}
		return out;
	}, [services]);

	const [selectionKey, setSelectionKey] = useState(() => {
		if (initialSelection) {
			return `${initialSelection.service}::${initialSelection.method}`;
		}
		return unaryMethods.length > 0 ? `${unaryMethods[0].service.name}::${unaryMethods[0].method.name}` : '';
	});
	const selection = useMemo<RpcSelection | undefined>(() => {
		const [svcName, methodName] = selectionKey.split('::');
		const svc = services.find(s => s.name === svcName);
		const method = svc?.methods.find(m => m.name === methodName);
		if (!svc || !method) return undefined;
		return { service: svc, method };
	}, [selectionKey, services]);

	const [requestJson, setRequestJson] = useState('{\n\t\n}');
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<InvokeUnaryRes | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function invoke() {
		if (!selection) return;
		setPending(true);
		setError(null);
		setResult(null);
		try {
			const res = await ipcGrpcService.invokeUnary({
				endpoint,
				descriptor,
				service: selection.service.name,
				method: selection.method.name,
				requestJson,
			});
			setResult(res);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setPending(false);
		}
	}

	const hasUnary = unaryMethods.length > 0;

	return (
		<Dialog onClose={onClose} tone='teal'>
			<Box w='560px'>
				<DialogHeader
					icon={<Network size={14} strokeWidth={2.2} />}
					title='Try a gRPC method'
					description={`Calling ${endpoint}`}
				/>
				<DialogBody>
					<Flex direction='column' gap='3'>
						{!hasUnary && (
							<Flex
								align='flex-start'
								gap='2'
								px='2.5'
								py='2'
								borderRadius='md'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 36%, var(--beak-colors-border-subtle))'
								bg='color-mix(in srgb, var(--beak-colors-accent-warning) 10%, var(--beak-colors-bg-surface))'
								fontSize='xs'
							>
								<Box color='accent.warning' flex='0 0 auto' mt='0.5'>
									<Sparkles size={11} strokeWidth={2.2} />
								</Box>
								<Box color='fg.default' lineHeight='1.55'>
									No unary methods on this endpoint. Streaming RPCs aren't wired into the test surface yet.
								</Box>
							</Flex>
						)}

						{hasUnary && (
							<Flex direction='column' gap='1'>
								<FieldLabel>Method</FieldLabel>
								<Flex
									align='center'
									gap='2'
									px='2.5'
									h='32px'
									borderRadius='md'
									borderWidth='1px'
									borderColor='border.subtle'
									bg='bg.canvas'
									_focusWithin={{
										borderColor: 'transparent',
										boxShadow:
											'inset 0 0 0 1px var(--beak-colors-accent-teal), 0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)',
									}}
								>
									<ChakraSelect
										value={selectionKey}
										onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
											setSelectionKey(e.currentTarget.value);
											setRequestJson('{\n\t\n}');
											setResult(null);
											setError(null);
										}}
										flex='1'
										h='100%'
										border='none'
										bg='transparent'
										color='fg.default'
										fontSize='13px'
										outline='none'
										css={{ appearance: 'none' }}
									>
										{unaryMethods.map(({ service, method }) => {
											const key = `${service.name}::${method.name}`;
											return (
												<option key={key} value={key}>
													{`${service.name} · ${method.name}`}
												</option>
											);
										})}
									</ChakraSelect>
									<Box color='fg.subtle' flex='0 0 auto'>
										<ChevronDown size={11} strokeWidth={2} />
									</Box>
								</Flex>
								{selection && (
									<Box fontSize='10.5px' color='fg.subtle' fontFamily='mono'>
										{`${selection.method.requestType} → ${selection.method.responseType}`}
									</Box>
								)}
							</Flex>
						)}

						{hasUnary && (
							<Flex direction='column' gap='1'>
								<FieldLabel>Request body (JSON)</FieldLabel>
								<ChakraTextarea
									value={requestJson}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequestJson(e.currentTarget.value)}
									spellCheck={false}
									w='100%'
									h='140px'
									p='2'
									borderRadius='md'
									borderWidth='1px'
									borderColor='border.subtle'
									bg='bg.canvas'
									color='fg.default'
									fontFamily='mono'
									fontSize='12px'
									resize='vertical'
									outline='none'
									_focus={{
										borderColor: 'transparent',
										boxShadow:
											'inset 0 0 0 1px var(--beak-colors-accent-teal), 0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)',
									}}
								/>
								<Box fontSize='10.5px' color='fg.subtle' lineHeight='1.45'>
									{'protobuf JSON form — field names match the message definition. Missing fields take protobuf defaults.'}
								</Box>
							</Flex>
						)}

						{result && (
							<Flex direction='column' gap='1'>
								<Flex align='center' gap='2'>
									<FieldLabel>Response</FieldLabel>
									<StatusBadge status={result.status} message={result.statusMessage} />
									<Box ml='auto' fontSize='10.5px' color='fg.subtle'>
										{`${result.durationMs}ms`}
									</Box>
								</Flex>
								<Box
									as='pre'
									p='2'
									borderRadius='md'
									borderWidth='1px'
									borderColor={
										result.status === 0
											? 'border.subtle'
											: 'color-mix(in srgb, var(--beak-colors-accent-alert) 36%, var(--beak-colors-border-subtle))'
									}
									bg='bg.canvas'
									color='fg.default'
									fontFamily='mono'
									fontSize='11.5px'
									overflowX='auto'
									whiteSpace='pre-wrap'
									wordBreak='break-word'
									m='0'
								>
									{result.status === 0 ? formatJson(result.responseJson) : result.statusMessage || `gRPC code ${result.status}`}
								</Box>
								{Object.keys(result.trailers).length > 0 && (
									<Box fontSize='10.5px' color='fg.subtle'>
										{`${Object.keys(result.trailers).length} trailer${Object.keys(result.trailers).length === 1 ? '' : 's'}`}
									</Box>
								)}
							</Flex>
						)}

						{error && (
							<Flex
								align='flex-start'
								gap='2'
								px='2.5'
								py='2'
								borderRadius='md'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 36%, var(--beak-colors-border-subtle))'
								bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
								fontSize='xs'
							>
								<Box color='accent.alert' flex='0 0 auto' mt='0.5'>
									<AlertOctagon size={11} strokeWidth={2.2} />
								</Box>
								<Box color='fg.default' lineHeight='1.55'>
									{error}
								</Box>
							</Flex>
						)}
					</Flex>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={onClose}>
						{'Close'}
					</Button>
					<Button size='sm' disabled={!selection || pending} onClick={invoke}>
						<Flex align='center' gap='1.5'>
							<Play size={11} strokeWidth={2.2} />
							{pending ? 'Sending…' : 'Send'}
						</Flex>
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

const FieldLabel: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box as='label' fontSize='10px' fontWeight='700' color='fg.subtle' letterSpacing='0.06em' textTransform='uppercase'>
		{children}
	</Box>
);

const StatusBadge: React.FC<{ status: number; message: string }> = ({ status }) => {
	const ok = status === 0;
	return (
		<Box
			as='span'
			display='inline-flex'
			alignItems='center'
			h='14px'
			px='1.5'
			borderRadius='sm'
			bg={
				ok
					? 'color-mix(in srgb, var(--beak-colors-accent-success) 14%, transparent)'
					: 'color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
			}
			color={ok ? 'accent.success' : 'accent.alert'}
			fontSize='9.5px'
			fontWeight='700'
			letterSpacing='0.04em'
			textTransform='uppercase'
		>
			{ok ? 'OK · 0' : `${gRpcCodeName(status)} · ${status}`}
		</Box>
	);
};

function gRpcCodeName(code: number): string {
	const names: Record<number, string> = {
		0: 'OK',
		1: 'CANCELLED',
		2: 'UNKNOWN',
		3: 'INVALID_ARGUMENT',
		4: 'DEADLINE_EXCEEDED',
		5: 'NOT_FOUND',
		6: 'ALREADY_EXISTS',
		7: 'PERMISSION_DENIED',
		8: 'RESOURCE_EXHAUSTED',
		9: 'FAILED_PRECONDITION',
		10: 'ABORTED',
		11: 'OUT_OF_RANGE',
		12: 'UNIMPLEMENTED',
		13: 'INTERNAL',
		14: 'UNAVAILABLE',
		15: 'DATA_LOSS',
		16: 'UNAUTHENTICATED',
	};
	return names[code] ?? `CODE_${code}`;
}

function formatJson(s: string): string {
	if (!s) return '';
	try {
		return JSON.stringify(JSON.parse(s), null, 2);
	} catch {
		return s;
	}
}

export default GrpcInvokeDialog;
