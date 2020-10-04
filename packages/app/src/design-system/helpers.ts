import { useTheme } from "styled-components";

export function statusToColour(status: number) {
	const theme = useTheme();

	switch (true) {
		case status < 300:
			return theme.ui.goAction;

		case status >= 300 && status < 400:
			return 'orange';

		case status >= 400 && status < 500:
			return theme.ui.destructiveAction;

		default:
			return 'pink';
	}
}
