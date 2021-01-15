export interface ShortcutDefinition {
	meta?: boolean;
	ctrl?: boolean;
	ctrlOrMeta?: boolean;
	alt?: boolean;
	shift?: boolean;
	key: string;
}

export interface PlatformSpecificDefinitions {
	type: 'specific';
	windows: ShortcutDefinition;
	darwin: ShortcutDefinition;
	linux: ShortcutDefinition;
}

export interface PlatformAgnosticDefinitions extends ShortcutDefinition {
	type: 'agnostic';
}
