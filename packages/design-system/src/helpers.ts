import { DefaultTheme } from 'styled-components';

export function statusToColour(theme: DefaultTheme, status: number) {
	switch (true) {
		case status >= 100 && status < 200:
			return theme.ui.textMinor;
		case status >= 200 && status < 300:
			return theme.ui.goAction;
		case status >= 300 && status < 400:
			return 'orange';
		case status >= 400 && status < 500:
			return '#5B5B95';
		case status >= 500 && status < 600:
			return theme.ui.destructiveAction;

		default:
			return 'pink';
	}
}
