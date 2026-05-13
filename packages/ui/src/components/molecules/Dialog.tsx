import { Dialog as ChakraDialog, Portal } from '@chakra-ui/react';
import React from 'react';

interface DialogProps {
	onClose: () => void;
}

/**
 * Beak's modal dialog — Chakra v3 `Dialog.Root` under the hood, but the
 * legacy "always-open-while-mounted" API is preserved so consumers don't
 * need to flip a controlled `open` flag. The consumer renders <Dialog/>
 * to show it and unmounts to close. Backdrop click + Escape both fire
 * `onClose`.
 *
 * The chrome (subtle border, surface background, slight backdrop blur)
 * uses the new Chakra semantic tokens (`bg.surface`, `border.subtle`)
 * so it switches with the theme automatically.
 */
const Dialog: React.FC<React.PropsWithChildren<DialogProps>> = ({ children, onClose }) => (
	<ChakraDialog.Root
		open
		onOpenChange={details => {
			if (!details.open) onClose();
		}}
		motionPreset='scale'
		size='md'
		placement='center'
		closeOnInteractOutside
	>
		<Portal>
			<ChakraDialog.Backdrop bg='blackAlpha.500' backdropFilter='blur(4px)' />
			<ChakraDialog.Positioner>
				<ChakraDialog.Content
					bg='bg.surface'
					borderWidth='1px'
					borderColor='border.subtle'
					borderRadius='md'
					boxShadow='0 12px 48px rgba(0, 0, 0, 0.35)'
					p='0'
				>
					{children}
				</ChakraDialog.Content>
			</ChakraDialog.Positioner>
		</Portal>
	</ChakraDialog.Root>
);

export default Dialog;
