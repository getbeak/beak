import type { LoadedExtension } from '@beak/common/types/extensions';
import { describe, expect, it, vi } from 'vitest';

import { ProjectExtensionRegistry } from '../registry-base';

interface TestRecord {
	loaded: LoadedExtension;
	readonly id: string;
}

function makeRecord(id: string, packageName: string): TestRecord {
	return {
		id,
		loaded: {
			status: 'loaded',
			packageName,
			version: '1.0.0',
			displayName: packageName,
			filePath: `/tmp/${packageName}`,
			apiVersion: 1,
			variables: [],
		},
	};
}

describe('ProjectExtensionRegistry', () => {
	it('insert + list returns the loaded surface of every registered package', async () => {
		const dispose = vi.fn();
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose });
		await reg.insert('p1', '@scope/a', makeRecord('a', '@scope/a'));
		await reg.insert('p1', 'b', makeRecord('b', 'b'));

		const listed = reg.list('p1');
		expect(listed.map(l => l.packageName).sort()).toEqual(['@scope/a', 'b']);
		expect(dispose).not.toHaveBeenCalled();
	});

	it('list returns [] for an unknown project', () => {
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose: vi.fn() });
		expect(reg.list('nobody')).toEqual([]);
	});

	it('byPackage returns the stored record', async () => {
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose: vi.fn() });
		const r = makeRecord('a', 'pkg');
		await reg.insert('p1', 'pkg', r);
		expect(reg.byPackage('p1', 'pkg')).toBe(r);
	});

	it('byPackage returns null when project or package is unknown', () => {
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose: vi.fn() });
		expect(reg.byPackage('p1', 'pkg')).toBeNull();
	});

	it('insert evicts a previous record under the same name + calls dispose on it', async () => {
		const dispose = vi.fn();
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose });
		const first = makeRecord('first', 'pkg');
		const second = makeRecord('second', 'pkg');
		await reg.insert('p1', 'pkg', first);
		await reg.insert('p1', 'pkg', second);
		expect(dispose).toHaveBeenCalledTimes(1);
		expect(dispose).toHaveBeenCalledWith(first);
		expect(reg.byPackage('p1', 'pkg')).toBe(second);
	});

	it('unload disposes the record and removes it from the bucket', async () => {
		const dispose = vi.fn();
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose });
		const r = makeRecord('a', 'pkg');
		await reg.insert('p1', 'pkg', r);
		await reg.unload('p1', 'pkg');
		expect(dispose).toHaveBeenCalledWith(r);
		expect(reg.byPackage('p1', 'pkg')).toBeNull();
	});

	it('unload of an unknown package is a no-op', async () => {
		const dispose = vi.fn();
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose });
		await reg.unload('p1', 'nope');
		expect(dispose).not.toHaveBeenCalled();
	});

	it('resetProject disposes every record and clears the bucket', async () => {
		const dispose = vi.fn();
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose });
		await reg.insert('p1', 'a', makeRecord('1', 'a'));
		await reg.insert('p1', 'b', makeRecord('2', 'b'));
		await reg.resetProject('p1');
		expect(dispose).toHaveBeenCalledTimes(2);
		expect(reg.list('p1')).toEqual([]);
	});

	it('resetProject is scoped to one project — other projects survive', async () => {
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose: vi.fn() });
		await reg.insert('p1', 'a', makeRecord('1', 'a'));
		await reg.insert('p2', 'a', makeRecord('2', 'a'));
		await reg.resetProject('p1');
		expect(reg.list('p1')).toEqual([]);
		expect(reg.list('p2').map(l => l.packageName)).toEqual(['a']);
	});

	it('awaits dispose when it returns a promise', async () => {
		const order: string[] = [];
		const dispose = vi.fn(async (r: TestRecord) => {
			await new Promise(resolve => setTimeout(resolve, 1));
			order.push(`disposed:${r.id}`);
		});
		const reg = new ProjectExtensionRegistry<TestRecord>({ dispose });
		await reg.insert('p1', 'pkg', makeRecord('first', 'pkg'));
		await reg.insert('p1', 'pkg', makeRecord('second', 'pkg'));
		order.push('after-second-insert');
		expect(order).toEqual(['disposed:first', 'after-second-insert']);
	});
});
