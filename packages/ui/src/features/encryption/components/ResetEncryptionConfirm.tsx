import { clearAllCookies } from '@beak/state/cookies';
import Button from '@beak/ui/components/atoms/Button';
import FormError from '@beak/ui/components/atoms/FormError';
import FormInput from '@beak/ui/components/atoms/FormInput';
import Input from '@beak/ui/components/atoms/Input';
import Label from '@beak/ui/components/atoms/Label';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { ipcEncryptionService } from '@beak/ui/lib/ipc';
import { alertRemoveType } from '@beak/ui/store/project/actions';
import { Box, Flex } from '@chakra-ui/react';
import { AlertOctagon, KeyRound, Skull } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';

interface ResetEncryptionConfirmProps {
	onClose: (resolved: boolean) => void;
}

const CONFIRMATION_PHRASE = 'RESET';

/**
 * Destructive flow that throws away the current per-project AES key and
 * mints a fresh one. The user must type the literal word `RESET` before
 * the confirm button enables. Everything previously encrypted with the
 * old key (secure variables, private variables, sealed cookie jars)
 * stays on disk as ciphertext but can no longer be decrypted — the
 * existing renderer paths will surface garbage / empty plaintext and
 * the user is expected to overwrite each value as they revisit it. We
 * also flush the in-memory cookie jar so any plaintext previously
 * hydrated under the old key doesn't get re-sealed under the new one.
 */
const ResetEncryptionConfirm: React.FC<ResetEncryptionConfirmProps> = ({ onClose }) => {
	const dispatch = useDispatch();
	const [phrase, setPhrase] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);

	const phraseMatches = phrase.trim() === CONFIRMATION_PHRASE;

	async function confirm() {
		if (!phraseMatches || busy) return;
		setBusy(true);
		try {
			const ok = await ipcEncryptionService.resetKey();
			if (!ok) {
				setError('The host couldn’t reset the key. Try re-opening the project.');
				return;
			}
			dispatch(clearAllCookies());
			dispatch(alertRemoveType('missing_encryption'));
			onClose(true);
		} catch {
			setError('Unknown error resetting the encryption key.');
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog onClose={() => onClose(false)} tone='alert'>
			<Box w='520px'>
				<DialogHeader
					icon={<Skull size={14} strokeWidth={2.2} />}
					title='Reset project encryption?'
					description='Only continue if you’ve lost the key and accept that every secret in this project will be permanently unreadable.'
				/>
				<DialogBody>
					<Flex
						align='flex-start'
						gap='2'
						px='2.5'
						py='2'
						mb='3'
						borderRadius='md'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 45%, var(--beak-colors-border-subtle))'
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
						color='fg.default'
						fontSize='xs'
						lineHeight='1.55'
					>
						<Box color='accent.alert' flex='0 0 auto' mt='0.5'>
							<AlertOctagon size={14} strokeWidth={2.2} />
						</Box>
						<Box>
							<Box as='span' fontWeight='600' display='block' mb='1'>
								{'This cannot be undone.'}
							</Box>
							{
								'A fresh AES-256 key replaces the current one. Existing ciphertext stays on disk but will no longer decrypt — the values become garbage until you re-enter each one.'
							}
						</Box>
					</Flex>

					<Box as='p' fontSize='sm' color='fg.default' mb='2' fontWeight='600'>
						{'What gets lost:'}
					</Box>
					<Box as='ul' pl='4' mb='4' fontSize='xs' color='fg.muted' lineHeight='1.7' css={{ listStyle: 'disc' }}>
						<Box as='li'>{'Every secure variable value across all variable sets.'}</Box>
						<Box as='li'>{'Every private variable value (your local-only secrets).'}</Box>
						<Box as='li'>{'The sealed cookie jar for this project.'}</Box>
					</Box>

					<Box as='p' fontSize='xs' color='fg.muted' mb='3' lineHeight='1.55'>
						{'If you still have the original key, '}
						<Box as='strong' color='fg.default'>
							{'cancel and paste it in'}
						</Box>
						{' instead — that recovers everything. Reset is only the right move when the key is genuinely gone.'}
					</Box>

					<FormInput>
						<Label>
							<Flex align='center' gap='1'>
								<KeyRound size={11} />
								{'Type '}
								<Box
									as='code'
									px='1'
									py='0.5'
									borderRadius='sm'
									bg='bg.subtle'
									color='fg.default'
									fontFamily='mono'
									fontSize='xs'
								>
									{CONFIRMATION_PHRASE}
								</Box>
								{' to confirm'}
							</Flex>
						</Label>
						<Input
							type='text'
							aria-label={`Type ${CONFIRMATION_PHRASE} to confirm`}
							autoFocus
							autoComplete='off'
							spellCheck={false}
							value={phrase}
							onChange={e => {
								if (error) setError('');
								setPhrase(e.currentTarget.value);
							}}
							onKeyDown={e => {
								if (e.key === 'Enter') confirm();
							}}
						/>
						{error && <FormError>{error}</FormError>}
					</FormInput>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)} disabled={busy}>
						{'Cancel'}
					</Button>
					<Button colour='destructive' size='sm' disabled={!phraseMatches || busy} onClick={confirm}>
						{busy ? 'Resetting…' : 'Reset encryption'}
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

export default ResetEncryptionConfirm;
