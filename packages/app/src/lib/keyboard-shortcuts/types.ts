export interface ShortcutDefinition {
	meta: boolean;
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
	key: string;
}

export interface PlatformSpecificDefinitions {
	type: 'psd';
	windows: ShortcutDefinition;
	darwin: ShortcutDefinition;
	linux: ShortcutDefinition;
}

export interface PlatformAgnosticDefinitions extends ShortcutDefinition {
	type: 'pad';
}
