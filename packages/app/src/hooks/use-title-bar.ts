import { Color, Titlebar } from 'custom-electron-titlebar';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTheme } from 'styled-components';

import WindowSessionContext from '../contexts/window-session-context';

export default function useTitleBar() {
	const theme = useTheme();
	const titleBar = useRef<Titlebar>();
	const [title, setTitle] = useState(window.document.title);
	const windowSession = useContext(WindowSessionContext);

	useEffect(() => {
		if (windowSession.isDarwin())
			return void 0;

		titleBar.current = new Titlebar({
			icon: './images/logo.svg',
			backgroundColor: Color.fromHex(theme.ui.surface),
		});

		const observer = new MutationObserver(mutations => {
			const title = mutations[0].target as HTMLElement;

			setTitle(title.innerText);
		});

		observer.observe(document.querySelector('title') as Node, {
			subtree: true,
			characterData: true,
			childList: true,
		});

		return () => {
			observer.disconnect();
		};
	}, [windowSession.platform]);

	useEffect(() => {
		if (windowSession.isDarwin() || !titleBar.current)
			return;

		titleBar.current.updateTitle(title);
	}, [windowSession.platform, title]);
}
