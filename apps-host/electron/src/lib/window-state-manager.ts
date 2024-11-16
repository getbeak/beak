import { WindowState } from '@beak/common-host/providers/storage';
import {
	BrowserWindow,
	BrowserWindowConstructorOptions,
	Rectangle,
	screen,
} from 'electron';

import getBeakHost from '../host';
import { screenshotSizing } from '../main';

export default class WindowStateManager {
	private windowKey: string;
	private window: BrowserWindow | undefined;
	private state: WindowState;
	private windowOptions: BrowserWindowConstructorOptions;

	// eslint-disable-next-line
	private stateChangeTimer: NodeJS.Timeout | undefined;

	constructor(
		existingWindowState: WindowState | undefined,
		windowKey: string,
		windowOptions: BrowserWindowConstructorOptions,
	) {
		this.windowKey = windowKey;
		this.windowOptions = windowOptions;

		if (existingWindowState && !screenshotSizing) {
			this.state = existingWindowState;
		} else {
			const cursor = screen.getCursorScreenPoint();
			const display = screen.getDisplayNearestPoint(cursor);

			this.state = {
				height: windowOptions.height!,
				width: windowOptions.width!,
				x: 0,
				y: 0,
				isFullScreen: false,
				isMaximized: false,
				display: {
					id: display.id,
					bounds: display.bounds,
				},
			};
		}
	}

	static async create(windowKey: string, windowOptions: BrowserWindowConstructorOptions) {
		const windowStates = await getBeakHost().providers.storage.get('windowStates');
		const windowState = windowStates[windowKey];

		return new WindowStateManager(windowState, windowKey, windowOptions);
	}

	attach(window: BrowserWindow) {
		this.window = window;

		this.ensureWindowBoundsAcceptable();

		if (this.state.isMaximized)
			this.window.maximize();
		else if (this.state.isFullScreen)
			this.window.setFullScreen(true);

		this.window.setPosition(this.state.x, this.state.y);

		if (this.windowOptions.resizable)
			this.window.setSize(this.state.width, this.state.height);
		else
			this.window.setSize(this.windowOptions.width!, this.windowOptions.height!);

		this.window.on('resize', () => this.stateChangedHandler());
		this.window.on('move', () => this.stateChangedHandler());
		this.window.on('close', () => this.closeHandler());
		this.window.on('closed', async () => await this.closedHandler());
	}

	detach() {
		if (!this.window)
			return;

		if (this.stateChangeTimer)
			global.clearTimeout(this.stateChangeTimer);
	}

	private stateChangedHandler() {
		if (this.stateChangeTimer)
			global.clearTimeout(this.stateChangeTimer);

		this.stateChangeTimer = setTimeout(() => this.updateState(), 100);
	}

	private closeHandler() {
		this.updateState();
	}

	private async closedHandler() {
		this.detach();
		await this.saveState();
	}

	private updateState() {
		if (!this.window)
			return;

		const bounds = this.window.getBounds();
		const display = screen.getDisplayMatching(bounds);

		if (this.isWindowNormal()) {
			this.state.height = bounds.height;
			this.state.width = bounds.width;
			this.state.x = bounds.x;
			this.state.y = bounds.y;
		}

		this.state.isMaximized = this.window.isMaximized();
		this.state.isFullScreen = this.window.isFullScreen();
		this.state.display = {
			id: display.id,
			bounds: display.bounds,
		};
	}

	private isWindowNormal() {
		if (!this.window)
			return true;

		return !this.window.isMaximized() && !this.window.isMinimized() && !this.window.isFullScreen();
	}

	private async saveState() {
		const windowStates = await getBeakHost().providers.storage.get('windowStates');

		windowStates[this.windowKey] = this.state;

		await getBeakHost().providers.storage.set('windowStates', windowStates);

		this.window = void 0;
	}

	private windowWithinBounds(bounds: Rectangle) {
		/* eslint-disable operator-linebreak */
		return (
			this.state.x >= bounds.x &&
			this.state.y >= bounds.y &&
			this.state.x + this.state.width <= bounds.x + bounds.width &&
			this.state.y + this.state.height <= bounds.y + bounds.height
		);
		/* eslint-enable operator-linebreak */
	}

	private ensureWindowBoundsAcceptable() {
		const visible = screen.getAllDisplays().some(display => this.windowWithinBounds(display.bounds));

		if (!visible) {
			this.state.x = 0;
			this.state.y = 0;
			this.state.display = {
				id: screen.getPrimaryDisplay().id,
				bounds: screen.getPrimaryDisplay().bounds,
			};
		}
	}
}
